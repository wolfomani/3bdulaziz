interface WebhookConfig {
  url: string
  secret?: string
  retryAttempts: number
  timeout: number
}

export class WebhookHandler {
  private config: WebhookConfig

  constructor(config: WebhookConfig) {
    this.config = config
  }

  async send(payload: any, headers: Record<string, string> = {}): Promise<boolean> {
    let attempts = 0

    while (attempts < this.config.retryAttempts) {
      try {
        const response = await fetch(this.config.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Timestamp": Date.now().toString(),
            "X-Webhook-Signature": this.generateSignature(payload),
            "User-Agent": "DrX3-Webhook-Handler/1.0",
            ...headers,
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(this.config.timeout),
        })

        if (response.ok) {
          console.log(`Webhook sent successfully to ${this.config.url}`)
          return true
        }

        console.warn(`Webhook attempt ${attempts + 1} failed:`, response.status, response.statusText)
      } catch (error) {
        console.error(`Webhook attempt ${attempts + 1} error:`, error)
      }

      attempts++

      if (attempts < this.config.retryAttempts) {
        await this.delay(Math.pow(2, attempts) * 1000) // Exponential backoff
      }
    }

    console.error(`Failed to send webhook after ${this.config.retryAttempts} attempts`)
    return false
  }

  private generateSignature(payload: any): string {
    if (!this.config.secret) return "no-signature"

    // In a real implementation, use HMAC-SHA256
    const crypto = require("crypto")
    const hmac = crypto.createHmac("sha256", this.config.secret)
    hmac.update(JSON.stringify(payload))
    return `sha256=${hmac.digest("hex")}`
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
  },
  github: {
    url: "https://api.github.com/repos/wolfomani/3bdulaziz/dispatches",
    retryAttempts: 2,
    timeout: 5000,
  },
  vercel: {
    url: "https://3bdulaziz.vercel.app/api/webhooks",
    retryAttempts: 3,
    timeout: 8000,
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
  }
}

export class WebhookEventLogger {
  private events: WebhookEvent[] = []
  private maxEvents = 1000

  log(event: WebhookEvent): void {
    this.events.unshift(event)
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents)
    }
  }

  getEvents(limit?: number): WebhookEvent[] {
    return limit ? this.events.slice(0, limit) : this.events
  }

  getEventsByType(type: string): WebhookEvent[] {
    return this.events.filter((event) => event.type === type)
  }

  clear(): void {
    this.events = []
  }
}

export const globalWebhookLogger = new WebhookEventLogger()
