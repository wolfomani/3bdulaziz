import crypto from "crypto"

interface WebhookConfig {
  url: string
  secret?: string
  retryAttempts: number
  timeout: number
  headers?: Record<string, string>
}

export class WebhookHandler {
  private config: WebhookConfig

  constructor(config: WebhookConfig) {
    this.config = config
  }

  async send(payload: any, additionalHeaders: Record<string, string> = {}): Promise<boolean> {
    let attempts = 0

    while (attempts < this.config.retryAttempts) {
      try {
        const headers = {
          "Content-Type": "application/json",
          "User-Agent": "DrX3-Webhook-Handler/1.0",
          "X-Webhook-Timestamp": Date.now().toString(),
          "X-Webhook-Attempt": (attempts + 1).toString(),
          ...this.config.headers,
          ...additionalHeaders,
        }

        // Add signature if secret is provided
        if (this.config.secret) {
          headers["X-Webhook-Signature"] = this.generateSignature(payload)
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

        const response = await fetch(this.config.url, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          console.log(`✅ Webhook sent successfully to ${this.config.url}`)
          return true
        }

        console.warn(`⚠️ Webhook attempt ${attempts + 1} failed:`, {
          status: response.status,
          statusText: response.statusText,
          url: this.config.url,
        })
      } catch (error) {
        console.error(`❌ Webhook attempt ${attempts + 1} error:`, {
          error: error instanceof Error ? error.message : "Unknown error",
          url: this.config.url,
        })
      }

      attempts++

      // Exponential backoff before retry
      if (attempts < this.config.retryAttempts) {
        const delay = Math.min(1000 * Math.pow(2, attempts), 10000) // Max 10 seconds
        await this.delay(delay)
        console.log(`🔄 Retrying webhook in ${delay}ms... (attempt ${attempts + 1}/${this.config.retryAttempts})`)
      }
    }

    console.error(`💥 Failed to send webhook after ${this.config.retryAttempts} attempts to ${this.config.url}`)
    return false
  }

  private generateSignature(payload: any): string {
    if (!this.config.secret) return "no-signature"

    try {
      const hmac = crypto.createHmac("sha256", this.config.secret)
      hmac.update(JSON.stringify(payload))
      return `sha256=${hmac.digest("hex")}`
    } catch (error) {
      console.error("Error generating webhook signature:", error)
      return "signature-error"
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Default webhook configurations
export const webhookConfigs = {
  webhookSite: {
    url: "https://webhook.site/4f2e177c-931c-49c2-a095-ad4ee2684614",
    retryAttempts: 3,
    timeout: 10000,
    headers: {
      "X-Source": "drx3-api",
      "X-Environment": process.env.NODE_ENV || "development",
    },
  },
  github: {
    url: "https://api.github.com/repos/wolfomani/3bdulaziz/dispatches",
    retryAttempts: 2,
    timeout: 5000,
    headers: {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  },
  vercel: {
    url: process.env.VERCEL_DEPLOY_HOOK || "https://api.vercel.com/v1/integrations/deploy",
    retryAttempts: 3,
    timeout: 8000,
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
    },
  },
}

export interface WebhookEvent {
  id: string
  type: string
  timestamp: string
  source: string
  data: any
  metadata?: {
    userAgent?: string
    ip?: string
    headers?: Record<string, string>
    signature?: string
    delivery?: string
  }
}

export class WebhookEventLogger {
  private events: WebhookEvent[] = []
  private maxEvents = 1000

  log(event: WebhookEvent): void {
    // Add event to beginning of array (most recent first)
    this.events.unshift(event)

    // Trim to max events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents)
    }

    console.log(`📝 Logged webhook event: ${event.type} (${event.source}) - ${event.id}`)
  }

  getEvents(limit?: number): WebhookEvent[] {
    return limit ? this.events.slice(0, limit) : [...this.events]
  }

  getEventsByType(type: string): WebhookEvent[] {
    return this.events.filter((event) => event.type.includes(type))
  }

  getEventsBySource(source: string): WebhookEvent[] {
    return this.events.filter((event) => event.source === source)
  }

  getEventById(id: string): WebhookEvent | undefined {
    return this.events.find((event) => event.id === id)
  }

  deleteEvent(id: string): boolean {
    const index = this.events.findIndex((event) => event.id === id)
    if (index !== -1) {
      this.events.splice(index, 1)
      console.log(`🗑️ Deleted webhook event: ${id}`)
      return true
    }
    return false
  }

  clearEvents(): number {
    const count = this.events.length
    this.events = []
    console.log(`🧹 Cleared ${count} webhook events`)
    return count
  }

  getStatistics() {
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const recentEvents = this.events.filter((event) => new Date(event.timestamp) >= last24h)

    const typeCount: Record<string, number> = {}
    const sourceCount: Record<string, number> = {}

    recentEvents.forEach((event) => {
      typeCount[event.type] = (typeCount[event.type] || 0) + 1
      sourceCount[event.source] = (sourceCount[event.source] || 0) + 1
    })

    return {
      total: this.events.length,
      last24h: recentEvents.length,
      byType: typeCount,
      bySource: sourceCount,
      oldestEvent: this.events[this.events.length - 1]?.timestamp || null,
      newestEvent: this.events[0]?.timestamp || null,
    }
  }
}

// Global webhook logger instance
export const globalWebhookLogger = new WebhookEventLogger()

// Webhook utilities
export class WebhookUtils {
  static validatePayload(payload: any, requiredFields: string[]): boolean {
    return requiredFields.every((field) => {
      const value = field.split(".").reduce((obj, key) => obj?.[key], payload)
      return value !== undefined && value !== null
    })
  }

  static sanitizePayload(payload: any, sensitiveFields: string[] = []): any {
    const sanitized = JSON.parse(JSON.stringify(payload))

    sensitiveFields.forEach((field) => {
      const keys = field.split(".")
      let obj = sanitized
      for (let i = 0; i < keys.length - 1; i++) {
        if (obj[keys[i]]) {
          obj = obj[keys[i]]
        } else {
          return
        }
      }
      if (obj[keys[keys.length - 1]]) {
        obj[keys[keys.length - 1]] = "[REDACTED]"
      }
    })

    return sanitized
  }

  static extractMetadata(request: Request): Record<string, string> {
    const metadata: Record<string, string> = {}

    // Common headers to extract
    const headersToExtract = [
      "user-agent",
      "x-forwarded-for",
      "x-real-ip",
      "x-github-event",
      "x-github-delivery",
      "x-hub-signature-256",
      "x-vercel-signature",
      "content-type",
      "content-length",
    ]

    headersToExtract.forEach((header) => {
      const value = request.headers.get(header)
      if (value) {
        metadata[header] = value
      }
    })

    return metadata
  }
}
