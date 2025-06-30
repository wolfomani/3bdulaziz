import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

const sql = neon(process.env.DATABASE_URL)

export interface Conversation {
  id: string
  user_id?: string
  title?: string
  created_at: Date
  updated_at: Date
  metadata?: Record<string, any>
}

export interface Message {
  id: string
  conversation_id: string
  role: "user" | "assistant" | "system"
  content: string
  created_at: Date
  metadata?: Record<string, any>
}

export interface UsageAnalytics {
  id: string
  session_id?: string
  provider?: string
  model?: string
  tokens_used?: number
  processing_time_ms?: number
  success?: boolean
  error_message?: string
  created_at: Date
  metadata?: Record<string, any>
}

export interface SystemSetting {
  id: string
  key: string
  value: any
  description?: string
  created_at: Date
  updated_at: Date
}

// Database operations
export class DrXDatabase {
  // Conversations
  static async createConversation(data: Partial<Conversation>): Promise<Conversation> {
    const [conversation] = await sql`
      INSERT INTO conversations (user_id, title, metadata)
      VALUES (${data.user_id || null}, ${data.title || null}, ${JSON.stringify(data.metadata || {})})
      RETURNING *
    `
    return conversation as Conversation
  }

  static async getConversation(id: string): Promise<Conversation | null> {
    const [conversation] = await sql`
      SELECT * FROM conversations WHERE id = ${id}
    `
    return (conversation as Conversation) || null
  }

  static async getRecentConversations(userId?: string, limit = 10) {
    return await sql`
      SELECT * FROM get_recent_conversations(${userId || null}, ${limit})
    `
  }

  static async updateConversation(id: string, data: Partial<Conversation>): Promise<Conversation> {
    const [conversation] = await sql`
      UPDATE conversations 
      SET title = COALESCE(${data.title}, title),
          metadata = COALESCE(${JSON.stringify(data.metadata)}, metadata),
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    return conversation as Conversation
  }

  static async deleteConversation(id: string): Promise<boolean> {
    const result = await sql`
      DELETE FROM conversations WHERE id = ${id}
    `
    return result.count > 0
  }

  // Messages
  static async createMessage(data: Omit<Message, "id" | "created_at">): Promise<Message> {
    const [message] = await sql`
      INSERT INTO messages (conversation_id, role, content, metadata)
      VALUES (${data.conversation_id}, ${data.role}, ${data.content}, ${JSON.stringify(data.metadata || {})})
      RETURNING *
    `
    return message as Message
  }

  static async getMessages(conversationId: string, limit = 50): Promise<Message[]> {
    return (await sql`
      SELECT * FROM messages 
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at ASC
      LIMIT ${limit}
    `) as Message[]
  }

  static async deleteMessage(id: string): Promise<boolean> {
    const result = await sql`
      DELETE FROM messages WHERE id = ${id}
    `
    return result.count > 0
  }

  // Usage Analytics
  static async logUsage(data: Omit<UsageAnalytics, "id" | "created_at">): Promise<UsageAnalytics> {
    const [usage] = await sql`
      INSERT INTO usage_analytics (
        session_id, provider, model, tokens_used, 
        processing_time_ms, success, error_message, metadata
      )
      VALUES (
        ${data.session_id || null}, ${data.provider || null}, ${data.model || null}, 
        ${data.tokens_used || 0}, ${data.processing_time_ms || 0}, 
        ${data.success !== false}, ${data.error_message || null}, 
        ${JSON.stringify(data.metadata || {})}
      )
      RETURNING *
    `
    return usage as UsageAnalytics
  }

  static async getUsageStats(daysBack = 7) {
    return await sql`
      SELECT * FROM get_usage_stats(${daysBack})
    `
  }

  // System Settings
  static async getSetting(key: string): Promise<any> {
    const [setting] = await sql`
      SELECT value FROM system_settings WHERE key = ${key}
    `
    return setting?.value || null
  }

  static async setSetting(key: string, value: any, description?: string): Promise<SystemSetting> {
    const [setting] = await sql`
      INSERT INTO system_settings (key, value, description)
      VALUES (${key}, ${JSON.stringify(value)}, ${description || null})
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        description = COALESCE(EXCLUDED.description, system_settings.description),
        updated_at = NOW()
      RETURNING *
    `
    return setting as SystemSetting
  }

  static async getAllSettings(): Promise<SystemSetting[]> {
    return (await sql`
      SELECT * FROM system_settings ORDER BY key
    `) as SystemSetting[]
  }

  // Utility functions
  static async healthCheck(): Promise<boolean> {
    try {
      await sql`SELECT 1`
      return true
    } catch (error) {
      console.error("Database health check failed:", error)
      return false
    }
  }

  static async cleanupOldData(daysToKeep = 30): Promise<number> {
    const [result] = await sql`
      SELECT cleanup_old_data(${daysToKeep}) as deleted_count
    `
    return result.deleted_count || 0
  }
}

export { sql }
export default DrXDatabase
