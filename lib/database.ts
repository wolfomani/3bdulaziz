import { neon } from "@neondatabase/serverless"
import { cache } from "./redis-cache"

const sql = neon(process.env.DATABASE_URL!)

export interface Conversation {
  id: string
  user_id: string
  title: string
  created_at: Date
  updated_at: Date
  metadata?: Record<string, any>
}

export interface Message {
  id: string
  conversation_id: string
  role: "user" | "assistant"
  content: string
  created_at: Date
  metadata?: Record<string, any>
}

export interface UsageLog {
  id: string
  session_id: string
  provider: string
  model: string
  tokens_used: number
  processing_time_ms: number
  success: boolean
  error_message?: string
  created_at: Date
  metadata?: Record<string, any>
}

class DrXDatabase {
  // Conversations
  static async createConversation(data: Omit<Conversation, "id" | "created_at" | "updated_at">): Promise<Conversation> {
    const [conversation] = await sql`
      INSERT INTO conversations (user_id, title, metadata)
      VALUES (${data.user_id}, ${data.title}, ${JSON.stringify(data.metadata || {})})
      RETURNING *
    `
    return conversation as Conversation
  }

  static async getConversation(id: string): Promise<Conversation | null> {
    const [conversation] = await sql`
      SELECT * FROM conversations WHERE id = ${id} LIMIT 1
    `
    return (conversation as Conversation) || null
  }

  static async getUserConversations(userId: string, limit = 50): Promise<Conversation[]> {
    const conversations = await sql`
      SELECT * FROM conversations 
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
      LIMIT ${limit}
    `
    return conversations as Conversation[]
  }

  static async updateConversation(id: string, data: Partial<Conversation>): Promise<Conversation | null> {
    const [conversation] = await sql`
      UPDATE conversations 
      SET title = COALESCE(${data.title}, title),
          metadata = COALESCE(${JSON.stringify(data.metadata)}, metadata),
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    return (conversation as Conversation) || null
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
      VALUES (
        ${data.conversation_id}, 
        ${data.role}, 
        ${data.content}, 
        ${JSON.stringify(data.metadata || {})}
      )
      RETURNING *
    `

    // Update conversation timestamp
    await sql`
      UPDATE conversations 
      SET updated_at = NOW() 
      WHERE id = ${data.conversation_id}
    `

    return message as Message
  }

  static async getConversationMessages(conversationId: string): Promise<Message[]> {
    const messages = await sql`
      SELECT * FROM messages 
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at ASC
    `
    return messages as Message[]
  }

  static async getMessage(id: string): Promise<Message | null> {
    const [message] = await sql`
      SELECT * FROM messages WHERE id = ${id} LIMIT 1
    `
    return (message as Message) || null
  }

  static async updateMessage(id: string, data: Partial<Message>): Promise<Message | null> {
    const [message] = await sql`
      UPDATE messages 
      SET content = COALESCE(${data.content}, content),
          metadata = COALESCE(${JSON.stringify(data.metadata)}, metadata)
      WHERE id = ${id}
      RETURNING *
    `
    return (message as Message) || null
  }

  static async deleteMessage(id: string): Promise<boolean> {
    const result = await sql`
      DELETE FROM messages WHERE id = ${id}
    `
    return result.count > 0
  }

  // Usage Logging
  static async logUsage(data: Omit<UsageLog, "id" | "created_at">): Promise<UsageLog> {
    const [log] = await sql`
      INSERT INTO usage_logs (
        session_id, provider, model, tokens_used, 
        processing_time_ms, success, error_message, metadata
      )
      VALUES (
        ${data.session_id}, ${data.provider}, ${data.model}, ${data.tokens_used},
        ${data.processing_time_ms}, ${data.success}, ${data.error_message || null},
        ${JSON.stringify(data.metadata || {})}
      )
      RETURNING *
    `
    return log as UsageLog
  }

  static async getUserUsage(userId: string, days = 30): Promise<UsageLog[]> {
    const logs = await sql`
      SELECT * FROM usage_logs 
      WHERE session_id = ${userId}
        AND created_at > NOW() - INTERVAL '${days} days'
      ORDER BY created_at DESC
    `
    return logs as UsageLog[]
  }

  // Statistics
  static async getUserStats(userId: string): Promise<{
    totalConversations: number
    totalMessages: number
    tokensUsed: number
    favoriteModel: string
  }> {
    // Get cached stats first
    const cacheKey = `user_stats:${userId}`
    const cached = await cache.get(cacheKey, "stats")
    if (cached) {
      return cached
    }

    // Calculate stats
    const [conversationStats] = await sql`
      SELECT COUNT(*) as total_conversations
      FROM conversations 
      WHERE user_id = ${userId}
    `

    const [messageStats] = await sql`
      SELECT COUNT(*) as total_messages
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.user_id = ${userId}
    `

    const [usageStats] = await sql`
      SELECT 
        SUM(tokens_used) as total_tokens,
        model,
        COUNT(*) as usage_count
      FROM usage_logs 
      WHERE session_id = ${userId}
        AND success = true
      GROUP BY model
      ORDER BY usage_count DESC
      LIMIT 1
    `

    const stats = {
      totalConversations: Number.parseInt(conversationStats.total_conversations) || 0,
      totalMessages: Number.parseInt(messageStats.total_messages) || 0,
      tokensUsed: Number.parseInt(usageStats?.total_tokens) || 0,
      favoriteModel: usageStats?.model || "غير محدد",
    }

    // Cache for 5 minutes
    await cache.set(cacheKey, stats, { prefix: "stats", ttl: 300 })

    return stats
  }

  static async getSystemStats(): Promise<{
    totalUsers: number
    totalConversations: number
    totalMessages: number
    totalTokensUsed: number
    activeUsers24h: number
  }> {
    const cacheKey = "system_stats"
    const cached = await cache.get(cacheKey, "stats")
    if (cached) {
      return cached
    }

    const [userStats] = await sql`
      SELECT COUNT(*) as total_users
      FROM users
    `

    const [conversationStats] = await sql`
      SELECT COUNT(*) as total_conversations
      FROM conversations
    `

    const [messageStats] = await sql`
      SELECT COUNT(*) as total_messages
      FROM messages
    `

    const [tokenStats] = await sql`
      SELECT SUM(tokens_used) as total_tokens
      FROM usage_logs
      WHERE success = true
    `

    const [activeUserStats] = await sql`
      SELECT COUNT(DISTINCT session_id) as active_users
      FROM usage_logs
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `

    const stats = {
      totalUsers: Number.parseInt(userStats.total_users) || 0,
      totalConversations: Number.parseInt(conversationStats.total_conversations) || 0,
      totalMessages: Number.parseInt(messageStats.total_messages) || 0,
      totalTokensUsed: Number.parseInt(tokenStats.total_tokens) || 0,
      activeUsers24h: Number.parseInt(activeUserStats.active_users) || 0,
    }

    // Cache for 10 minutes
    await cache.set(cacheKey, stats, { prefix: "stats", ttl: 600 })

    return stats
  }

  // Search
  static async searchConversations(userId: string, query: string, limit = 20): Promise<Conversation[]> {
    const conversations = await sql`
      SELECT DISTINCT c.* FROM conversations c
      JOIN messages m ON c.id = m.conversation_id
      WHERE c.user_id = ${userId}
        AND (c.title ILIKE ${"%" + query + "%"} OR m.content ILIKE ${"%" + query + "%"})
      ORDER BY c.updated_at DESC
      LIMIT ${limit}
    `
    return conversations as Conversation[]
  }

  static async searchMessages(userId: string, query: string, limit = 50): Promise<Message[]> {
    const messages = await sql`
      SELECT m.* FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.user_id = ${userId}
        AND m.content ILIKE ${"%" + query + "%"}
      ORDER BY m.created_at DESC
      LIMIT ${limit}
    `
    return messages as Message[]
  }

  // Cleanup
  static async cleanupOldData(days = 90): Promise<{
    deletedConversations: number
    deletedMessages: number
    deletedLogs: number
  }> {
    // Delete old conversations and their messages
    const conversationResult = await sql`
      DELETE FROM conversations 
      WHERE updated_at < NOW() - INTERVAL '${days} days'
    `

    // Delete old usage logs
    const logResult = await sql`
      DELETE FROM usage_logs 
      WHERE created_at < NOW() - INTERVAL '${days} days'
    `

    return {
      deletedConversations: conversationResult.count || 0,
      deletedMessages: 0, // Messages are deleted via CASCADE
      deletedLogs: logResult.count || 0,
    }
  }

  // Health check
  static async healthCheck(): Promise<{ status: "healthy" | "unhealthy"; details: any }> {
    try {
      const [result] = await sql`SELECT 1 as test`

      if (result.test === 1) {
        return {
          status: "healthy",
          details: {
            database: "connected",
            timestamp: new Date().toISOString(),
          },
        }
      } else {
        throw new Error("Unexpected result")
      }
    } catch (error) {
      return {
        status: "unhealthy",
        details: {
          database: "disconnected",
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        },
      }
    }
  }
}

export default DrXDatabase
