import { createClient } from "@/lib/database"
import { getRedisClient } from "@/lib/redis-cache"
import { cookies } from "next/headers"
import { randomBytes } from "crypto"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 أيام

export interface User {
  id: string
  email?: string
  phone?: string
  github_id?: string
  github_username?: string
  name?: string
  avatar_url?: string
  created_at: Date
  last_login: Date
  is_verified: boolean
}

export interface Session {
  id: string
  user_id: string
  expires_at: Date
  created_at: Date
  user_agent?: string
  ip_address?: string
}

export class AuthService {
  private static db = createClient()
  private static redis = getRedisClient()

  // إنشاء جلسة جديدة
  static async createSession(userId: string, userAgent?: string, ipAddress?: string): Promise<string> {
    const sessionId = randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + SESSION_DURATION)

    try {
      await this.db.query(
        `
        INSERT INTO sessions (id, user_id, expires_at, user_agent, ip_address)
        VALUES ($1, $2, $3, $4, $5)
      `,
        [sessionId, userId, expiresAt, userAgent, ipAddress],
      )

      // حفظ في Redis للوصول السريع
      const redis = await this.redis
      if (redis) {
        await redis.setex(`session:${sessionId}`, Math.floor(SESSION_DURATION / 1000), userId)
      }

      return sessionId
    } catch (error) {
      console.error("Failed to create session:", error)
      throw new Error("Failed to create session")
    }
  }

  // التحقق من الجلسة
  static async validateSession(sessionId: string): Promise<User | null> {
    if (!sessionId) return null

    try {
      // تحقق من Redis أولاً
      const redis = await this.redis
      if (redis) {
        const userId = await redis.get(`session:${sessionId}`)
        if (userId) {
          return await this.getUserById(userId)
        }
      }

      // تحقق من قاعدة البيانات
      const result = await this.db.query(
        `
        SELECT u.*, s.expires_at
        FROM users u
        JOIN sessions s ON u.id = s.user_id
        WHERE s.id = $1 AND s.expires_at > NOW()
      `,
        [sessionId],
      )

      if (result.rows.length === 0) return null

      const user = result.rows[0]

      // تحديث آخر تسجيل دخول
      await this.updateLastLogin(user.id)

      return user
    } catch (error) {
      console.error("Session validation error:", error)
      return null
    }
  }

  // إنهاء الجلسة
  static async destroySession(sessionId: string): Promise<void> {
    try {
      await this.db.query("DELETE FROM sessions WHERE id = $1", [sessionId])

      const redis = await this.redis
      if (redis) {
        await redis.del(`session:${sessionId}`)
      }
    } catch (error) {
      console.error("Failed to destroy session:", error)
    }
  }

  // إنشاء مستخدم جديد
  static async createUser(userData: Partial<User>): Promise<User> {
    const userId = randomBytes(16).toString("hex")

    try {
      const result = await this.db.query(
        `
        INSERT INTO users (id, email, phone, github_id, github_username, name, avatar_url, is_verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `,
        [
          userId,
          userData.email || null,
          userData.phone || null,
          userData.github_id || null,
          userData.github_username || null,
          userData.name || null,
          userData.avatar_url || null,
          userData.is_verified || false,
        ],
      )

      return result.rows[0]
    } catch (error) {
      console.error("Failed to create user:", error)
      throw new Error("Failed to create user")
    }
  }

  // البحث عن مستخدم
  static async findUser(criteria: { email?: string; phone?: string; github_id?: string }): Promise<User | null> {
    try {
      let query = "SELECT * FROM users WHERE "
      const conditions = []
      const values = []
      let paramIndex = 1

      if (criteria.email) {
        conditions.push(`email = $${paramIndex++}`)
        values.push(criteria.email)
      }
      if (criteria.phone) {
        conditions.push(`phone = $${paramIndex++}`)
        values.push(criteria.phone)
      }
      if (criteria.github_id) {
        conditions.push(`github_id = $${paramIndex++}`)
        values.push(criteria.github_id)
      }

      if (conditions.length === 0) return null

      query += conditions.join(" OR ")

      const result = await this.db.query(query, values)
      return result.rows[0] || null
    } catch (error) {
      console.error("Failed to find user:", error)
      return null
    }
  }

  // الحصول على مستخدم بالمعرف
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const result = await this.db.query("SELECT * FROM users WHERE id = $1", [userId])
      return result.rows[0] || null
    } catch (error) {
      console.error("Failed to get user:", error)
      return null
    }
  }

  // تحديث آخر تسجيل دخول
  static async updateLastLogin(userId: string): Promise<void> {
    try {
      await this.db.query("UPDATE users SET last_login = NOW() WHERE id = $1", [userId])
    } catch (error) {
      console.error("Failed to update last login:", error)
    }
  }

  // إنشاء رمز التحقق للهاتف
  static async createPhoneVerification(phone: string): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString() // 6 أرقام
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 دقائق

    try {
      await this.db.query(
        `
        INSERT INTO phone_verifications (phone, code, expires_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (phone) 
        DO UPDATE SET code = $2, expires_at = $3, created_at = NOW()
      `,
        [phone, code, expiresAt],
      )

      return code
    } catch (error) {
      console.error("Failed to create phone verification:", error)
      throw new Error("Failed to create verification code")
    }
  }

  // التحقق من رمز الهاتف
  static async verifyPhoneCode(phone: string, code: string): Promise<boolean> {
    try {
      const result = await this.db.query(
        `
        SELECT * FROM phone_verifications 
        WHERE phone = $1 AND code = $2 AND expires_at > NOW()
      `,
        [phone, code],
      )

      if (result.rows.length > 0) {
        // حذف الرمز بعد الاستخدام
        await this.db.query("DELETE FROM phone_verifications WHERE phone = $1", [phone])
        return true
      }

      return false
    } catch (error) {
      console.error("Phone verification error:", error)
      return false
    }
  }

  // تنظيف الجلسات المنتهية الصلاحية
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      await this.db.query("DELETE FROM sessions WHERE expires_at < NOW()")
      console.log("Expired sessions cleaned up")
    } catch (error) {
      console.error("Failed to cleanup sessions:", error)
    }
  }

  // الحصول على المستخدم الحالي من الكوكيز
  static async getCurrentUser(): Promise<User | null> {
    try {
      const cookieStore = cookies()
      const sessionId = cookieStore.get("session_id")?.value

      if (!sessionId) return null

      return await this.validateSession(sessionId)
    } catch (error) {
      console.error("Failed to get current user:", error)
      return null
    }
  }

  // تسجيل الخروج
  static async logout(): Promise<void> {
    try {
      const cookieStore = cookies()
      const sessionId = cookieStore.get("session_id")?.value

      if (sessionId) {
        await this.destroySession(sessionId)
      }

      // حذف الكوكي
      cookieStore.delete("session_id")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }
}

// دالة مساعدة لتعيين كوكي الجلسة
export function setSessionCookie(sessionId: string) {
  const cookieStore = cookies()
  cookieStore.set("session_id", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION / 1000,
    path: "/",
  })
}

// دالة مساعدة للتحقق من المصادقة
export async function requireAuth(): Promise<User> {
  const user = await AuthService.getCurrentUser()
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}
