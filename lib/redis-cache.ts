import { Redis } from "@upstash/redis"

// Redis client for caching and session management
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  prefix?: string
}

export class RedisCache {
  private redis: Redis
  private defaultTTL = 3600 // 1 hour

  constructor() {
    this.redis = redis
  }

  // Basic cache operations
  async get<T>(key: string, prefix?: string): Promise<T | null> {
    try {
      const fullKey = prefix ? `${prefix}:${key}` : key
      const value = await this.redis.get(fullKey)
      return value as T
    } catch (error) {
      console.error("Redis GET error:", error)
      return null
    }
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    try {
      const fullKey = options.prefix ? `${options.prefix}:${key}` : key
      const ttl = options.ttl || this.defaultTTL

      await this.redis.setex(fullKey, ttl, JSON.stringify(value))
      return true
    } catch (error) {
      console.error("Redis SET error:", error)
      return false
    }
  }

  async del(key: string, prefix?: string): Promise<boolean> {
    try {
      const fullKey = prefix ? `${prefix}:${key}` : key
      await this.redis.del(fullKey)
      return true
    } catch (error) {
      console.error("Redis DEL error:", error)
      return false
    }
  }

  // Session management
  async setSession(sessionId: string, sessionData: any, ttl = 86400): Promise<boolean> {
    return this.set(sessionId, sessionData, { prefix: "session", ttl })
  }

  async getSession(sessionId: string): Promise<any> {
    return this.get(sessionId, "session")
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return this.del(sessionId, "session")
  }

  // Conversation caching
  async cacheConversation(conversationId: string, messages: any[], ttl = 3600): Promise<boolean> {
    return this.set(conversationId, messages, { prefix: "conversation", ttl })
  }

  async getCachedConversation(conversationId: string): Promise<any[] | null> {
    return this.get(conversationId, "conversation")
  }

  // Rate limiting
  async checkRateLimit(
    identifier: string,
    limit: number,
    window: number,
  ): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
  }> {
    try {
      const key = `ratelimit:${identifier}`
      const current = ((await this.redis.get(key)) as number) || 0

      if (current >= limit) {
        const ttl = await this.redis.ttl(key)
        return {
          allowed: false,
          remaining: 0,
          resetTime: Date.now() + ttl * 1000,
        }
      }

      const newCount = current + 1
      if (current === 0) {
        await this.redis.setex(key, window, newCount)
      } else {
        await this.redis.incr(key)
      }

      return {
        allowed: true,
        remaining: limit - newCount,
        resetTime: Date.now() + window * 1000,
      }
    } catch (error) {
      console.error("Rate limit check error:", error)
      return { allowed: true, remaining: limit - 1, resetTime: Date.now() + window * 1000 }
    }
  }

  // Model performance caching
  async cacheModelPerformance(modelName: string, metrics: any, ttl = 1800): Promise<boolean> {
    return this.set(modelName, metrics, { prefix: "model_perf", ttl })
  }

  async getModelPerformance(modelName: string): Promise<any> {
    return this.get(modelName, "model_perf")
  }

  // System status caching
  async cacheSystemStatus(status: any, ttl = 300): Promise<boolean> {
    return this.set("system_status", status, { prefix: "system", ttl })
  }

  async getSystemStatus(): Promise<any> {
    return this.get("system_status", "system")
  }

  // Bulk operations
  async mget(keys: string[], prefix?: string): Promise<(any | null)[]> {
    try {
      const fullKeys = keys.map((key) => (prefix ? `${prefix}:${key}` : key))
      const values = await this.redis.mget(...fullKeys)
      return values.map((value) => (value ? JSON.parse(value as string) : null))
    } catch (error) {
      console.error("Redis MGET error:", error)
      return keys.map(() => null)
    }
  }

  async mset(keyValuePairs: Array<[string, any]>, options: CacheOptions = {}): Promise<boolean> {
    try {
      const ttl = options.ttl || this.defaultTTL
      const prefix = options.prefix

      for (const [key, value] of keyValuePairs) {
        const fullKey = prefix ? `${prefix}:${key}` : key
        await this.redis.setex(fullKey, ttl, JSON.stringify(value))
      }
      return true
    } catch (error) {
      console.error("Redis MSET error:", error)
      return false
    }
  }

  // Pattern-based operations
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
      return keys.length
    } catch (error) {
      console.error("Redis delete pattern error:", error)
      return 0
    }
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping()
      return result === "PONG"
    } catch (error) {
      console.error("Redis ping error:", error)
      return false
    }
  }

  // Get cache statistics
  async getStats(): Promise<{
    connected: boolean
    memory_usage?: string
    total_keys?: number
  }> {
    try {
      const connected = await this.ping()

      if (!connected) {
        return { connected: false }
      }

      // Note: Upstash Redis may not support all INFO commands
      return {
        connected: true,
        memory_usage: "N/A",
        total_keys: 0,
      }
    } catch (error) {
      console.error("Redis stats error:", error)
      return { connected: false }
    }
  }
}

// Export singleton instance
export const cache = new RedisCache()

// Utility functions
export async function withCache<T>(key: string, fetcher: () => Promise<T>, options: CacheOptions = {}): Promise<T> {
  // Try to get from cache first
  const cached = await cache.get<T>(key, options.prefix)
  if (cached !== null) {
    return cached
  }

  // If not in cache, fetch and cache the result
  const result = await fetcher()
  await cache.set(key, result, options)
  return result
}

export async function invalidateCache(pattern: string): Promise<number> {
  return cache.deletePattern(pattern)
}
