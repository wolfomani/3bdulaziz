import crypto from "crypto"
import type { Request } from "next/server"

// Force dynamic rendering to avoid build errors
export const dynamic = "force-dynamic"

interface WebhookConfig {
  url: string
  secret?: string
  retryAttempts?: number
  timeout?: number
  headers?: Record<string, string>
}

export interface WebhookEvent {
  id: string
  type: string
  timestamp: string
  source: string
  data: any
  metadata?: Record<string, any>
}

export interface WebhookStatistics {
  total: number
  bySource: Record<string, number>
  byType: Record<string, number>
  oldestEvent: string | null
  newestEvent: string | null
  last24Hours: number
}

export class WebhookLogger {
  private events: WebhookEvent[] = []
  private maxEvents = 1000

  constructor(maxEvents = 1000) {
    this.maxEvents = maxEvents
  }

  log(event: WebhookEvent): void {
    this.events.unshift(event)

    // Keep only the most recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents)
    }
  }

  getEvents(limit?: number): WebhookEvent[] {
    return limit ? this.events.slice(0, limit) : [...this.events]
  }

  getEventById(id: string): WebhookEvent | undefined {
    return this.events.find((event) => event.id === id)
  }

  deleteEvent(id: string): boolean {
    const index = this.events.findIndex((event) => event.id === id)
    if (index !== -1) {
      this.events.splice(index, 1)
      return true
    }
    return false
  }

  clearEvents(): number {
    const count = this.events.length
    this.events = []
    return count
  }

  getStatistics(): WebhookStatistics {
    const now = new Date()
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const bySource: Record<string, number> = {}
    const byType: Record<string, number> = {}
    let last24HoursCount = 0

    this.events.forEach((event) => {
      // Count by source
      bySource[event.source] = (bySource[event.source] || 0) + 1

      // Count by type
      byType[event.type] = (byType[event.type] || 0) + 1

      // Count last 24 hours
      if (new Date(event.timestamp) >= last24Hours) {
        last24HoursCount++
      }
    })

    return {
      total: this.events.length,
      bySource,
      byType,
      oldestEvent: this.events.length > 0 ? this.events[this.events.length - 1].timestamp : null,
      newestEvent: this.events.length > 0 ? this.events[0].timestamp : null,
      last24Hours: last24HoursCount,
    }
  }
}

export class WebhookHandler {
  private config: WebhookConfig

  constructor(config: WebhookConfig) {
    this.config = {
      retryAttempts: 3,
      timeout: 10000,
      ...config,
    }
  }

  async send(payload: any): Promise<boolean> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= (this.config.retryAttempts || 3); attempt++) {
      try {
        const response = await this.makeRequest(payload)

        if (response.ok) {
          console.log(`✅ Webhook sent successfully to ${this.config.url}`)
          return true
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error")
        console.warn(`⚠️ Webhook attempt ${attempt} failed:`, lastError.message)

        if (attempt < (this.config.retryAttempts || 3)) {
          // Exponential backoff
          const delay = Math.pow(2, attempt - 1) * 1000
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    console.error(`❌ Webhook failed after ${this.config.retryAttempts} attempts:`, lastError?.message)
    return false
  }

  private async makeRequest(payload: any): Promise<Response> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "DrX-Webhook/1.0",
      ...this.config.headers,
    }

    // Add signature if secret is provided
    if (this.config.secret) {
      const signature = this.generateSignature(JSON.stringify(payload), this.config.secret)
      headers["X-Webhook-Signature"] = signature
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(this.config.url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  private generateSignature(payload: string, secret: string): string {
    return `sha256=${crypto.createHmac("sha256", secret).update(payload).digest("hex")}`
  }
}

export class WebhookUtils {
  static validateSignature(payload: string, signature: string, secret: string): boolean {
    try {
      const expectedSignature = `sha256=${crypto.createHmac("sha256", secret).update(payload).digest("hex")}`
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    } catch (error) {
      console.error("Signature validation error:", error)
      return false
    }
  }

  static extractMetadata(request: Request): Record<string, any> {
    return {
      userAgent: request.headers.get("user-agent") || "unknown",
      origin: request.headers.get("origin") || "unknown",
      referer: request.headers.get("referer") || "unknown",
      contentType: request.headers.get("content-type") || "unknown",
      timestamp: new Date().toISOString(),
    }
  }

  static parseWebhookEvent(request: Request, body: any, source: string): Partial<WebhookEvent> {
    return {
      type: `${source}.${body.action || body.type || "unknown"}`,
      source,
      data: body,
      metadata: this.extractMetadata(request),
    }
  }
}

// Global webhook logger instance
export const globalWebhookLogger = new WebhookLogger(1000)

// Webhook configurations
export const webhookConfigs = {
  webhookSite: {
    url: "https://webhook.site/4f2e177c-931c-49c2-a095-ad4ee2684614",
    timeout: 5000,
    retryAttempts: 2,
    headers: {
      "X-Source": "DrX-API",
    },
  },

  discord: {
    url: process.env.DISCORD_WEBHOOK_URL || "",
    timeout: 10000,
    retryAttempts: 3,
    headers: {
      "X-Source": "DrX-Discord",
    },
  },

  slack: {
    url: process.env.SLACK_WEBHOOK_URL || "",
    timeout: 10000,
    retryAttempts: 3,
    headers: {
      "X-Source": "DrX-Slack",
    },
  },
}

// Webhook event types
export const WEBHOOK_EVENTS = {
  GITHUB: {
    PING: "github.ping",
    PUSH: "github.push",
    PULL_REQUEST: "github.pull_request",
    ISSUES: "github.issues",
    RELEASE: "github.release",
    STAR: "github.star",
    FORK: "github.fork",
    WORKFLOW_RUN: "github.workflow_run",
  },

  VERCEL: {
    DEPLOYMENT_CREATED: "vercel.deployment.created",
    DEPLOYMENT_BUILDING: "vercel.deployment.building",
    DEPLOYMENT_READY: "vercel.deployment.ready",
    DEPLOYMENT_ERROR: "vercel.deployment.error",
    DEPLOYMENT_CANCELED: "vercel.deployment.canceled",
  },

  TEST: {
    PING: "test.ping",
    BASIC: "test.basic",
    ERROR: "test.error",
    PERFORMANCE: "test.performance",
  },
} as const

// Helper function to create webhook events
export function createWebhookEvent(
  type: string,
  source: string,
  data: any,
  metadata?: Record<string, any>,
): WebhookEvent {
  return {
    id: crypto.randomUUID(),
    type,
    timestamp: new Date().toISOString(),
    source,
    data,
    metadata: {
      created_by: "webhook-handler",
      version: "1.0.0",
      ...metadata,
    },
  }
}

// Export types for external use
export type { WebhookEvent, WebhookConfig, WebhookStatistics }
