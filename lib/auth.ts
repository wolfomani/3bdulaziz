import { neon } from "@neondatabase/serverless"
import { cookies } from "next/headers"
import type { NextRequest } from "next/server"
import crypto from "crypto"

const sql = neon(process.env.DATABASE_URL!)

export interface User {
  id: string
  email?: string
  phone?: string
  name?: string
  avatar?: string
  github_id?: string
  github_username?: string
  created_at: Date
  updated_at: Date
  last_login?: Date
  is_verified: boolean
  metadata?: Record<string, any>
}

export interface Session {
  id: string
  user_id: string
  token: string
  expires_at: Date
  created_at: Date
  ip_address?: string
  user_agent?: string
  is_active: boolean
}

// JWT utilities
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}

// User management
export class AuthService {
  // Create or update user
  static async createOrUpdateUser(userData: Partial<User>): Promise<User> {
    try {
      const [user] = await sql`
        INSERT INTO users (email, phone, name, avatar, github_id, github_username, metadata, is_verified)
        VALUES (
          ${userData.email || null},
          ${userData.phone || null},
          ${userData.name || null},
          ${userData.avatar || null},
          ${userData.github_id || null},
          ${userData.github_username || null},
          ${JSON.stringify(userData.metadata || {})},
          ${userData.is_verified || false}
        )
        ON CONFLICT (email) DO UPDATE SET
          name = COALESCE(EXCLUDED.name, users.name),
          avatar = COALESCE(EXCLUDED.avatar, users.avatar),
          github_id = COALESCE(EXCLUDED.github_id, users.github_id),
          github_username = COALESCE(EXCLUDED.github_username, users.github_username),
          metadata = COALESCE(EXCLUDED.metadata, users.metadata),
          updated_at = NOW(),
          last_login = NOW()
        RETURNING *
      `
      return user as User
    } catch (error) {
      console.error("Create user error:", error)
      throw new Error("Failed to create user")
    }
  }

  // Find user by email or phone
  static async findUser(identifier: string): Promise<User | null> {
    try {
      const [user] = await sql`
        SELECT * FROM users 
        WHERE email = ${identifier} OR phone = ${identifier} OR github_username = ${identifier}
        LIMIT 1
      `
      return (user as User) || null
    } catch (error) {
      console.error("Find user error:", error)
      return null
    }
  }

  // Find user by GitHub ID
  static async findUserByGitHubId(githubId: string): Promise<User | null> {
    try {
      const [user] = await sql`
        SELECT * FROM users WHERE github_id = ${githubId} LIMIT 1
      `
      return (user as User) || null
    } catch (error) {
      console.error("Find user by GitHub ID error:", error)
      return null
    }
  }

  // Create session
  static async createSession(userId: string, request?: NextRequest): Promise<Session> {
    try {
      const token = generateToken()
      const hashedToken = hashToken(token)
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

      const [session] = await sql`
        INSERT INTO sessions (user_id, token, expires_at, ip_address, user_agent)
        VALUES (
          ${userId},
          ${hashedToken},
          ${expiresAt.toISOString()},
          ${request?.ip || null},
          ${request?.headers.get("user-agent") || null}
        )
        RETURNING *
      `

      return { ...session, token } as Session
    } catch (error) {
      console.error("Create session error:", error)
      throw new Error("Failed to create session")
    }
  }

  // Validate session
  static async validateSession(token: string): Promise<{ user: User; session: Session } | null> {
    if (!token) return null

    try {
      const hashedToken = hashToken(token)
      const [result] = await sql`
        SELECT 
          s.id as session_id,
          s.user_id,
          s.expires_at,
          s.created_at as session_created_at,
          s.ip_address,
          s.user_agent,
          s.is_active,
          u.id,
          u.email,
          u.phone,
          u.name,
          u.avatar,
          u.github_id,
          u.github_username,
          u.created_at,
          u.updated_at,
          u.last_login,
          u.is_verified,
          u.metadata
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ${hashedToken} 
          AND s.expires_at > NOW() 
          AND s.is_active = true
        LIMIT 1
      `

      if (!result) return null

      const user: User = {
        id: result.id,
        email: result.email,
        phone: result.phone,
        name: result.name,
        avatar: result.avatar,
        github_id: result.github_id,
        github_username: result.github_username,
        created_at: result.created_at,
        updated_at: result.updated_at,
        last_login: result.last_login,
        is_verified: result.is_verified,
        metadata: result.metadata,
      }

      const session: Session = {
        id: result.session_id,
        user_id: result.user_id,
        token,
        expires_at: result.expires_at,
        created_at: result.session_created_at,
        ip_address: result.ip_address,
        user_agent: result.user_agent,
        is_active: result.is_active,
      }

      return { user, session }
    } catch (error) {
      console.error("Validate session error:", error)
      return null
    }
  }

  // Logout (invalidate session)
  static async logout(token: string): Promise<boolean> {
    try {
      const hashedToken = hashToken(token)
      await sql`
        UPDATE sessions 
        SET is_active = false 
        WHERE token = ${hashedToken}
      `
      return true
    } catch (error) {
      console.error("Logout error:", error)
      return false
    }
  }

  // GitHub OAuth
  static async handleGitHubCallback(
    code: string,
  ): Promise<{ success: boolean; user?: User; session?: Session; message: string }> {
    try {
      // Exchange code for access token
      const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID || "Ov23liupXR6o8HmvL3Nj",
          client_secret: process.env.GITHUB_CLIENT_SECRET || "1f32cdd8c3b2e1af2793589f4ede7ae68a8428fe",
          code,
        }),
      })

      const tokenData = await tokenResponse.json()
      if (!tokenData.access_token) {
        throw new Error("Failed to get access token")
      }

      // Get user info from GitHub
      const userResponse = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/vnd.github+json",
        },
      })

      const githubUser = await userResponse.json()

      // Create or update user
      let user = await this.findUserByGitHubId(githubUser.id.toString())
      if (!user) {
        user = await this.createOrUpdateUser({
          email: githubUser.email,
          name: githubUser.name || githubUser.login,
          avatar: githubUser.avatar_url,
          github_id: githubUser.id.toString(),
          github_username: githubUser.login,
          is_verified: true,
          metadata: {
            github_profile: githubUser,
          },
        })
      } else {
        await sql`
          UPDATE users 
          SET last_login = NOW(), 
              avatar = COALESCE(${githubUser.avatar_url}, avatar),
              name = COALESCE(${githubUser.name}, name)
          WHERE id = ${user.id}
        `
      }

      // Create session
      const session = await this.createSession(user.id)

      return {
        success: true,
        user,
        session,
        message: "تم تسجيل الدخول بنجاح",
      }
    } catch (error) {
      console.error("GitHub OAuth error:", error)
      return {
        success: false,
        message: "فشل في تسجيل الدخول عبر GitHub",
      }
    }
  }
}

// Cookie helpers
export function setAuthCookie(token: string) {
  const cookieStore = cookies()
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  })
}

export function clearAuthCookie() {
  const cookieStore = cookies()
  cookieStore.delete("auth_token")
}
