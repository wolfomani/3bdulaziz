import { SignJWT, jwtVerify } from "jose"
import { neon } from "@neondatabase/serverless"
import { cache } from "./redis-cache"

const sql = neon(process.env.DATABASE_URL!)
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "drx3-secret-key-2024")

export interface User {
  id: string
  name: string
  email?: string
  phone?: string
  avatar?: string
  provider: "github" | "phone"
  github_id?: string
  created_at: Date
  last_login: Date
}

export interface AuthSession {
  userId: string
  token: string
  expiresAt: Date
}

// Create JWT token
export async function createToken(user: User): Promise<string> {
  const token = await new SignJWT({
    userId: user.id,
    name: user.name,
    email: user.email,
    provider: user.provider,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET)

  // Cache user data
  await cache.set(`user:${user.id}`, user, { prefix: "auth", ttl: 604800 }) // 7 days

  return token
}

// Verify JWT token
export async function verifyToken(token: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)

    const userId = payload.userId as string

    // Try to get from cache first
    const cachedUser = await cache.get<User>(`user:${userId}`, "auth")
    if (cachedUser) {
      return cachedUser
    }

    // Get from database
    const [user] = await sql`
      SELECT * FROM users WHERE id = ${userId} LIMIT 1
    `

    if (!user) {
      return null
    }

    const userData: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      provider: user.provider,
      github_id: user.github_id,
      created_at: user.created_at,
      last_login: user.last_login,
    }

    // Cache for future requests
    await cache.set(`user:${userId}`, userData, { prefix: "auth", ttl: 3600 })

    return userData
  } catch (error) {
    console.error("Token verification error:", error)
    return null
  }
}

// Create or update user
export async function createOrUpdateUser(userData: Partial<User>): Promise<User> {
  try {
    if (userData.provider === "github" && userData.github_id) {
      // Check if user exists by GitHub ID
      const [existingUser] = await sql`
        SELECT * FROM users WHERE github_id = ${userData.github_id} LIMIT 1
      `

      if (existingUser) {
        // Update existing user
        const [updatedUser] = await sql`
          UPDATE users 
          SET name = ${userData.name},
              email = ${userData.email},
              avatar = ${userData.avatar},
              last_login = NOW()
          WHERE github_id = ${userData.github_id}
          RETURNING *
        `
        return updatedUser as User
      }
    }

    if (userData.provider === "phone" && userData.phone) {
      // Check if user exists by phone
      const [existingUser] = await sql`
        SELECT * FROM users WHERE phone = ${userData.phone} LIMIT 1
      `

      if (existingUser) {
        // Update last login
        const [updatedUser] = await sql`
          UPDATE users 
          SET last_login = NOW()
          WHERE phone = ${userData.phone}
          RETURNING *
        `
        return updatedUser as User
      }
    }

    // Create new user
    const [newUser] = await sql`
      INSERT INTO users (name, email, phone, avatar, provider, github_id)
      VALUES (
        ${userData.name},
        ${userData.email || null},
        ${userData.phone || null},
        ${userData.avatar || null},
        ${userData.provider},
        ${userData.github_id || null}
      )
      RETURNING *
    `

    return newUser as User
  } catch (error) {
    console.error("User creation error:", error)
    throw new Error("فشل في إنشاء المستخدم")
  }
}

// GitHub OAuth
export async function handleGitHubCallback(code: string): Promise<{ user: User; token: string }> {
  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenData.access_token) {
      throw new Error("فشل في الحصول على رمز الوصول")
    }

    // Get user data from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    const githubUser = await userResponse.json()

    // Create or update user
    const user = await createOrUpdateUser({
      name: githubUser.name || githubUser.login,
      email: githubUser.email,
      avatar: githubUser.avatar_url,
      provider: "github",
      github_id: githubUser.id.toString(),
    })

    // Create JWT token
    const token = await createToken(user)

    return { user, token }
  } catch (error) {
    console.error("GitHub OAuth error:", error)
    throw new Error("فشل في تسجيل الدخول عبر GitHub")
  }
}

// Phone authentication (simulation)
export async function sendPhoneVerification(phone: string): Promise<{ success: boolean; code?: string }> {
  try {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Store code in cache for 5 minutes
    await cache.set(`phone_code:${phone}`, code, { prefix: "auth", ttl: 300 })

    // In production, send SMS here
    console.log(`SMS Code for ${phone}: ${code}`)

    return { success: true, code } // Remove code in production
  } catch (error) {
    console.error("Phone verification error:", error)
    return { success: false }
  }
}

export async function verifyPhoneCode(phone: string, code: string): Promise<{ user: User; token: string } | null> {
  try {
    // Get stored code
    const storedCode = await cache.get<string>(`phone_code:${phone}`, "auth")

    if (!storedCode || storedCode !== code) {
      return null
    }

    // Delete used code
    await cache.delete(`phone_code:${phone}`, "auth")

    // Create or update user
    const user = await createOrUpdateUser({
      name: `مستخدم ${phone.slice(-4)}`,
      phone,
      provider: "phone",
    })

    // Create JWT token
    const token = await createToken(user)

    return { user, token }
  } catch (error) {
    console.error("Phone code verification error:", error)
    return null
  }
}

// Logout
export async function logout(userId: string): Promise<void> {
  try {
    // Remove from cache
    await cache.delete(`user:${userId}`, "auth")
  } catch (error) {
    console.error("Logout error:", error)
  }
}

// Get user by ID
export async function getUserById(userId: string): Promise<User | null> {
  try {
    // Try cache first
    const cachedUser = await cache.get<User>(`user:${userId}`, "auth")
    if (cachedUser) {
      return cachedUser
    }

    // Get from database
    const [user] = await sql`
      SELECT * FROM users WHERE id = ${userId} LIMIT 1
    `

    if (!user) {
      return null
    }

    const userData: User = user as User

    // Cache for future requests
    await cache.set(`user:${userId}`, userData, { prefix: "auth", ttl: 3600 })

    return userData
  } catch (error) {
    console.error("Get user error:", error)
    return null
  }
}

// AuthService class for centralized authentication management
export class AuthService {
  static async createToken(user: User): Promise<string> {
    return createToken(user)
  }

  static async verifyToken(token: string): Promise<User | null> {
    return verifyToken(token)
  }

  static async createOrUpdateUser(userData: Partial<User>): Promise<User> {
    return createOrUpdateUser(userData)
  }

  static async handleGitHubCallback(code: string): Promise<{ user: User; token: string }> {
    return handleGitHubCallback(code)
  }

  static async sendPhoneVerification(phone: string): Promise<{ success: boolean; code?: string }> {
    return sendPhoneVerification(phone)
  }

  static async verifyPhoneCode(phone: string, code: string): Promise<{ user: User; token: string } | null> {
    return verifyPhoneCode(phone, code)
  }

  static async logout(userId: string): Promise<void> {
    return logout(userId)
  }

  static async getUserById(userId: string): Promise<User | null> {
    return getUserById(userId)
  }

  // Additional utility methods
  static async validateSession(token: string): Promise<{ valid: boolean; user?: User }> {
    try {
      const user = await this.verifyToken(token)
      return { valid: !!user, user: user || undefined }
    } catch (error) {
      return { valid: false }
    }
  }

  static async refreshUserCache(userId: string): Promise<void> {
    try {
      const user = await getUserById(userId)
      if (user) {
        await cache.set(`user:${userId}`, user, { prefix: "auth", ttl: 3600 })
      }
    } catch (error) {
      console.error("Failed to refresh user cache:", error)
    }
  }
}
