import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export interface CacheOptions {
  prefix?: string
  ttl?: number // seconds
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
}

export interface SessionData {
  id: string
  user_id: string
  expires_at: string
}

class RedisCache {
  private getKey(key: string, prefix?: string): string {
    return prefix ? `${prefix}:${key}` : key
  }

  // Basic cache operations
  async get<T = any>(key: string, prefix?: string): Promise<T | null> {
    try {
      const fullKey = this.getKey(key, prefix)
      const value = await redis.get(fullKey)
      return value as T
    } catch (error) {
      console.error("Redis GET error:", error)
      return null
    }
  }

  async set(key: string, value: any, options: CacheOptions = {}): Promise<boolean> {
    try {
      const fullKey = this.getKey(key, options.prefix)

      if (options.ttl) {
        await redis.setex(fullKey, options.ttl, JSON.stringify(value))
      } else {
        await redis.set(fullKey, JSON.stringify(value))
      }

      return true
    } catch (error) {
      console.error("Redis SET error:", error)
      return false
    }
  }

  async del(key: string, prefix?: string): Promise<boolean> {
    try {
      const fullKey = this.getKey(key, prefix)
      const result = await redis.del(fullKey)
      return result > 0
    } catch (error) {
      console.error("Redis DEL error:", error)
      return false
    }
  }

  async exists(key: string, prefix?: string): Promise<boolean> {
    try {
      const fullKey = this.getKey(key, prefix)
      const result = await redis.exists(fullKey)
      return result > 0
    } catch (error) {
      console.error("Redis EXISTS error:", error)
      return false
    }
  }

  // Rate limiting
  async checkRateLimit(identifier: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    try {
      const key = `rate_limit:${identifier}`
      const now = Math.floor(Date.now() / 1000)
      const window = Math.floor(now / windowSeconds) * windowSeconds
      const windowKey = `${key}:${window}`

      // Get current count
      const current = (await redis.get(windowKey)) || 0
      const currentCount = typeof current === "number" ? current : Number.parseInt(current as string) || 0

      if (currentCount >= limit) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: window + windowSeconds,
        }
      }

      // Increment counter
      const newCount = await redis.incr(windowKey)

      // Set expiration if this is the first increment
      if (newCount === 1) {
        await redis.expire(windowKey, windowSeconds)
      }

      return {
        allowed: true,
        remaining: Math.max(0, limit - newCount),
        resetTime: window + windowSeconds,
      }
    } catch (error) {
      console.error("Rate limit error:", error)
      // Allow request on error
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: Math.floor(Date.now() / 1000) + windowSeconds,
      }
    }
  }

  // Session management
  async setSession(token: string, sessionData: SessionData, ttlSeconds: number): Promise<boolean> {
    try {
      const key = `session:${token}`
      await redis.setex(key, ttlSeconds, JSON.stringify(sessionData))
      return true
    } catch (error) {
      console.error("Session set error:", error)
      return false
    }
  }

  async getSession(token: string): Promise<SessionData | null> {
    try {
      const key = `session:${token}`
      const data = await redis.get(key)
      return data ? JSON.parse(data as string) : null
    } catch (error) {
      console.error("Session get error:", error)
      return null
    }
  }

  async deleteSession(token: string): Promise<boolean> {
    try {
      const key = `session:${token}`
      const result = await redis.del(key)
      return result > 0
    } catch (error) {
      console.error("Session delete error:", error)
      return false
    }
  }

  // AI response caching
  async cacheAIResponse(queryHash: string, response: any, ttlSeconds = 1800): Promise<boolean> {
    return this.set(`ai_response:${queryHash}`, response, { ttl: ttlSeconds })
  }

  async getCachedAIResponse(queryHash: string): Promise<any> {
    return this.get(`ai_response:${queryHash}`)
  }

  // Analytics caching
  async cacheAnalytics(key: string, data: any, ttlSeconds = 300): Promise<boolean> {
    return this.set(key, data, { prefix: "analytics", ttl: ttlSeconds })
  }

  async getCachedAnalytics(key: string): Promise<any> {
    return this.get(key, "analytics")
  }

  // Webhook event caching
  async cacheWebhookEvent(eventId: string, eventData: any, ttlSeconds = 3600): Promise<boolean> {
    return this.set(`webhook_event:${eventId}`, eventData, { ttl: ttlSeconds })
  }

  async getCachedWebhookEvent(eventId: string): Promise<any> {
    return this.get(`webhook_event:${eventId}`)
  }

  // List operations
  async lpush(key: string, value: any, prefix?: string): Promise<number> {
    try {
      const fullKey = this.getKey(key, prefix)
      return await redis.lpush(fullKey, JSON.stringify(value))
    } catch (error) {
      console.error("Redis LPUSH error:", error)
      return 0
    }
  }

  async lrange(key: string, start: number, stop: number, prefix?: string): Promise<any[]> {
    try {
      const fullKey = this.getKey(key, prefix)
      const values = await redis.lrange(fullKey, start, stop)
      return values.map((v) => {
        try {
          return JSON.parse(v)
        } catch {
          return v
        }
      })
    } catch (error) {
      console.error("Redis LRANGE error:", error)
      return []
    }
  }

  async ltrim(key: string, start: number, stop: number, prefix?: string): Promise<boolean> {
    try {
      const fullKey = this.getKey(key, prefix)
      await redis.ltrim(fullKey, start, stop)
      return true
    } catch (error) {
      console.error("Redis LTRIM error:", error)
      return false
    }
  }

  // Hash operations
  async hset(key: string, field: string, value: any, prefix?: string): Promise<boolean> {
    try {
      const fullKey = this.getKey(key, prefix)
      await redis.hset(fullKey, { [field]: JSON.stringify(value) })
      return true
    } catch (error) {
      console.error("Redis HSET error:", error)
      return false
    }
  }

  async hget(key: string, field: string, prefix?: string): Promise<any> {
    try {
      const fullKey = this.getKey(key, prefix)
      const value = await redis.hget(fullKey, field)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error("Redis HGET error:", error)
      return null
    }
  }

  async hgetall(key: string, prefix?: string): Promise<Record<string, any>> {
    try {
      const fullKey = this.getKey(key, prefix)
      const hash = await redis.hgetall(fullKey)
      const result: Record<string, any> = {}

      for (const [field, value] of Object.entries(hash)) {
        try {
          result[field] = JSON.parse(value as string)
        } catch {
          result[field] = value
        }
      }

      return result
    } catch (error) {
      console.error("Redis HGETALL error:", error)
      return {}
    }
  }

  // Set operations
  async sadd(key: string, member: any, prefix?: string): Promise<boolean> {
    try {
      const fullKey = this.getKey(key, prefix)
      const result = await redis.sadd(fullKey, JSON.stringify(member))
      return result > 0
    } catch (error) {
      console.error("Redis SADD error:", error)
      return false
    }
  }

  async smembers(key: string, prefix?: string): Promise<any[]> {
    try {
      const fullKey = this.getKey(key, prefix)
      const members = await redis.smembers(fullKey)
      return members.map((m) => {
        try {
          return JSON.parse(m)
        } catch {
          return m
        }
      })
    } catch (error) {
      console.error("Redis SMEMBERS error:", error)
      return []
    }
  }

  async srem(key: string, member: any, prefix?: string): Promise<boolean> {
    try {
      const fullKey = this.getKey(key, prefix)
      const result = await redis.srem(fullKey, JSON.stringify(member))
      return result > 0
    } catch (error) {
      console.error("Redis SREM error:", error)
      return false
    }
  }

  // Utility methods
  async keys(pattern: string): Promise<string[]> {
    try {
      return await redis.keys(pattern)
    } catch (error) {
      console.error("Redis KEYS error:", error)
      return []
    }
  }

  async flushdb(): Promise<boolean> {
    try {
      await redis.flushdb()
      return true
    } catch (error) {
      console.error("Redis FLUSHDB error:", error)
      return false
    }
  }

  async ping(): Promise<boolean> {
    try {
      const result = await redis.ping()
      return result === "PONG"
    } catch (error) {
      console.error("Redis PING error:", error)
      return false
    }
  }

  // Batch operations
  async mget(keys: string[], prefix?: string): Promise<(any | null)[]> {
    try {
      const fullKeys = keys.map((key) => this.getKey(key, prefix))
      const values = await redis.mget(...fullKeys)
      return values.map((v) => {
        if (v === null) return null
        try {
          return JSON.parse(v)
        } catch {
          return v
        }
      })
    } catch (error) {
      console.error("Redis MGET error:", error)
      return keys.map(() => null)
    }
  }

  async mset(keyValuePairs: Record<string, any>, options: CacheOptions = {}): Promise<boolean> {
    try {
      const pairs: Record<string, string> = {}

      for (const [key, value] of Object.entries(keyValuePairs)) {
        const fullKey = this.getKey(key, options.prefix)
        pairs[fullKey] = JSON.stringify(value)
      }

      await redis.mset(pairs)

      // Set TTL for each key if specified
      if (options.ttl) {
        const promises = Object.keys(pairs).map((key) => redis.expire(key, options.ttl!))
        await Promise.all(promises)
      }

      return true
    } catch (error) {
      console.error("Redis MSET error:", error)
      return false
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: "healthy" | "unhealthy"; latency?: number; error?: string }> {
    try {
      const start = Date.now()
      await this.ping()
      const latency = Date.now() - start

      return {
        status: "healthy",
        latency,
      }
    } catch (error) {
      return {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}

export const cache = new RedisCache()
export default cache
