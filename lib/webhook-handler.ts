import { DrXDatabase } from "./database"
import { v4 as uuidv4 } from "uuid"
import crypto from "crypto"

interface WebhookConfig {
  url: string
  secret?: string
  retryAttempts: number
  timeout: number
  headers?: Record<string, string>
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

export class WebhookHandler {
  private config: WebhookConfig

  constructor(config: WebhookConfig) {
    this.config = config
  }

  async processWebhook(event: Omit<WebhookEvent, "id">): Promise<WebhookEvent> {
    const webhookEvent: WebhookEvent = {
      id: uuidv4(),
      ...event,
      timestamp: new Date().toISOString(),
    }

    try {
      // Log the event
      globalWebhookLogger.log(webhookEvent)

      // Process based on source
      await this.processEventBySource(webhookEvent)

      webhookEvent.metadata = { ...webhookEvent.metadata, processed: true }

      // Update the logged event
      globalWebhookLogger.updateEvent(webhookEvent.id)

      return webhookEvent
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      webhookEvent.metadata = { ...webhookEvent.metadata, error: errorMessage, processed: false }

      console.error(`Webhook processing failed for ${webhookEvent.id}:`, error)

      // Update the logged event with error
      globalWebhookLogger.updateEvent(webhookEvent.id)

      return webhookEvent
    }
  }

  private async processEventBySource(event: WebhookEvent): Promise<void> {
    switch (event.source) {
      case "github":
        await this.processGitHubEvent(event)
        break
      case "vercel":
        await this.processVercelEvent(event)
        break
      case "generic":
      default:
        await this.processGenericEvent(event)
        break
    }
  }

  private async processGitHubEvent(event: WebhookEvent): Promise<void> {
    const { type, data } = event

    switch (type) {
      case "github.push":
        console.log(`GitHub Push: ${data.commits?.length || 0} commits to ${data.ref}`)
        break
      case "github.pull_request":
        console.log(`GitHub PR: ${data.action} #${data.number}`)
        break
      case "github.issues":
        console.log(`GitHub Issue: ${data.action} #${data.issue?.number}`)
        break
      case "github.release":
        console.log(`GitHub Release: ${data.action} ${data.release?.tag_name}`)
        break
      case "github.ping":
        console.log("GitHub Ping received")
        break
      default:
        console.log(`GitHub Event: ${type}`)
    }
  }

  private async processVercelEvent(event: WebhookEvent): Promise<void> {
    const { type, data } = event

    switch (type) {
      case "vercel.deployment.created":
        console.log(`Vercel Deployment Created: ${data.deployment?.url}`)
        break
      case "vercel.deployment.succeeded":
        console.log(`Vercel Deployment Succeeded: ${data.deployment?.url}`)
        break
      case "vercel.deployment.failed":
        console.log(`Vercel Deployment Failed: ${data.deployment?.url}`)
        break
      default:
        console.log(`Vercel Event: ${type}`)
    }
  }

  private async processGenericEvent(event: WebhookEvent): Promise<void> {
    console.log(`Generic Webhook: ${event.type}`)
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

  async getSystemHealth(): Promise<{
    status: string
    database: boolean
    events_processed: number
    last_event?: string
  }> {
    try {
      const dbHealth = await DrXDatabase.healthCheck()
      const stats = globalWebhookLogger.getStatistics()

      return {
        status: dbHealth ? "healthy" : "degraded",
        database: dbHealth,
        events_processed: stats.total,
        last_event: stats.newestEvent,
      }
    } catch (error) {
      return {
        status: "unhealthy",
        database: false,
        events_processed: 0,
      }
    }
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

  updateEvent(id: string): void {
    const event = this.getEventById(id)
    if (event) {
      console.log(`🔄 Updated webhook event: ${event.type} (${event.source}) - ${event.id}`)
    }
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
  static validateSignature(payload: string, signature: string, secret: string): boolean {
    try {
      const expectedSignature = `sha256=${crypto.createHmac("sha256", secret).update(payload).digest("hex")}`
      return signature === expectedSignature
    } catch (error) {
      console.error("Error validating webhook signature:", error)
      return false
    }
  }

  static parseGitHubEvent(headers: Record<string, string>, payload: any) {
    return {
      event: headers["x-github-event"],
      delivery: headers["x-github-delivery"],
      signature: headers["x-hub-signature-256"],
      repository: payload.repository?.full_name,
      sender: payload.sender?.login,
    }
  }

  static parseVercelEvent(headers: Record<string, string>, payload: any) {
    return {
      event: headers["x-vercel-event"],
      signature: headers["x-vercel-signature"],
      deployment: payload.deployment?.url,
      project: payload.project?.name,
    }
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

  static async retryWithBackoff<T>(fn: () => Promise<T>, maxAttempts = 3, baseDelay = 1000): Promise<T> {
    let lastError: Error

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        if (attempt === maxAttempts) {
          throw lastError
        }

        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 10000)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    throw lastError!
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

export default WebhookHandler
