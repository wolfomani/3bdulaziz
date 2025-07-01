import { neon } from "@neondatabase/serverless"
import { cache } from "./redis-cache"

const sql = neon(process.env.DATABASE_URL!)

export interface WebhookEvent {
  id: string
  type: string
  source: "github" | "vercel" | "custom"
  payload: Record<string, any>
  headers: Record<string, string>
  timestamp: Date
  processed: boolean
  retry_count: number
  error_message?: string
}

export interface WebhookConfig {
  id: string
  name: string
  url: string
  secret?: string
  events: string[]
  active: boolean
  created_at: Date
  last_triggered?: Date
  success_count: number
  failure_count: number
}

export class WebhookHandler {
  // Store webhook event
  static async storeEvent(
    event: Omit<WebhookEvent, "id" | "timestamp" | "processed" | "retry_count">,
  ): Promise<WebhookEvent> {
    const [storedEvent] = await sql`
      INSERT INTO webhook_events (type, source, payload, headers)
      VALUES (
        ${event.type},
        ${event.source},
        ${JSON.stringify(event.payload)},
        ${JSON.stringify(event.headers)}
      )
      RETURNING *
    `

    // Cache recent events
    await cache.set(`webhook_event:${storedEvent.id}`, storedEvent, { prefix: "webhooks", ttl: 3600 })

    return storedEvent as WebhookEvent
  }

  // Process GitHub webhook
  static async processGitHubWebhook(
    payload: any,
    headers: Record<string, string>,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const event = headers["x-github-event"]
      const signature = headers["x-hub-signature-256"]

      // Verify signature if secret is configured
      if (process.env.GITHUB_WEBHOOK_SECRET) {
        const crypto = require("crypto")
        const expectedSignature =
          "sha256=" +
          crypto.createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET).update(JSON.stringify(payload)).digest("hex")

        if (signature !== expectedSignature) {
          throw new Error("Invalid signature")
        }
      }

      // Store event
      const webhookEvent = await this.storeEvent({
        type: event,
        source: "github",
        payload,
        headers,
      })

      // Process specific events
      switch (event) {
        case "push":
          await this.handleGitHubPush(payload)
          break
        case "pull_request":
          await this.handleGitHubPullRequest(payload)
          break
        case "issues":
          await this.handleGitHubIssue(payload)
          break
        case "star":
          await this.handleGitHubStar(payload)
          break
        default:
          console.log(`Unhandled GitHub event: ${event}`)
      }

      // Mark as processed
      await sql`
        UPDATE webhook_events 
        SET processed = true 
        WHERE id = ${webhookEvent.id}
      `

      return { success: true, message: `GitHub ${event} event processed successfully` }
    } catch (error) {
      console.error("GitHub webhook processing error:", error)
      return { success: false, message: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  // Process Vercel webhook
  static async processVercelWebhook(
    payload: any,
    headers: Record<string, string>,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const event = payload.type || "deployment"

      // Store event
      const webhookEvent = await this.storeEvent({
        type: event,
        source: "vercel",
        payload,
        headers,
      })

      // Process deployment events
      if (event === "deployment") {
        await this.handleVercelDeployment(payload)
      }

      // Mark as processed
      await sql`
        UPDATE webhook_events 
        SET processed = true 
        WHERE id = ${webhookEvent.id}
      `

      return { success: true, message: `Vercel ${event} event processed successfully` }
    } catch (error) {
      console.error("Vercel webhook processing error:", error)
      return { success: false, message: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  // GitHub event handlers
  private static async handleGitHubPush(payload: any) {
    const { repository, commits, pusher } = payload

    console.log(`Push to ${repository.full_name} by ${pusher.name}`)
    console.log(`${commits.length} commits pushed`)

    // Store push analytics
    await sql`
      INSERT INTO github_analytics (event_type, repository, user, metadata)
      VALUES (
        'push',
        ${repository.full_name},
        ${pusher.name},
        ${JSON.stringify({ commits: commits.length, ref: payload.ref })}
      )
    `

    // Trigger deployment if needed
    if (payload.ref === "refs/heads/main" && process.env.VERCEL_DEPLOY_HOOK) {
      await fetch(process.env.VERCEL_DEPLOY_HOOK, { method: "POST" })
    }
  }

  private static async handleGitHubPullRequest(payload: any) {
    const { action, pull_request, repository } = payload

    console.log(`PR ${action}: ${pull_request.title} in ${repository.full_name}`)

    await sql`
      INSERT INTO github_analytics (event_type, repository, user, metadata)
      VALUES (
        'pull_request',
        ${repository.full_name},
        ${pull_request.user.login},
        ${JSON.stringify({ action, pr_number: pull_request.number, title: pull_request.title })}
      )
    `
  }

  private static async handleGitHubIssue(payload: any) {
    const { action, issue, repository } = payload

    console.log(`Issue ${action}: ${issue.title} in ${repository.full_name}`)

    await sql`
      INSERT INTO github_analytics (event_type, repository, user, metadata)
      VALUES (
        'issue',
        ${repository.full_name},
        ${issue.user.login},
        ${JSON.stringify({ action, issue_number: issue.number, title: issue.title })}
      )
    `
  }

  private static async handleGitHubStar(payload: any) {
    const { action, repository, sender } = payload

    console.log(`Repository ${action === "created" ? "starred" : "unstarred"} by ${sender.login}`)

    await sql`
      INSERT INTO github_analytics (event_type, repository, user, metadata)
      VALUES (
        'star',
        ${repository.full_name},
        ${sender.login},
        ${JSON.stringify({ action, stars: repository.stargazers_count })}
      )
    `
  }

  private static async handleVercelDeployment(payload: any) {
    const { deployment, project } = payload

    console.log(`Deployment ${deployment.state} for ${project.name}`)

    await sql`
      INSERT INTO deployment_analytics (project, deployment_id, state, url, metadata)
      VALUES (
        ${project.name},
        ${deployment.id},
        ${deployment.state},
        ${deployment.url || null},
        ${JSON.stringify({
          created_at: deployment.createdAt,
          ready_at: deployment.readyAt,
          source: deployment.source,
        })}
      )
    `
  }

  // Get webhook statistics
  static async getWebhookStats(): Promise<{
    total_events: number
    processed_events: number
    failed_events: number
    events_by_source: Record<string, number>
    recent_events: WebhookEvent[]
  }> {
    const [stats] = await sql`
      SELECT 
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE processed = true) as processed_events,
        COUNT(*) FILTER (WHERE error_message IS NOT NULL) as failed_events
      FROM webhook_events
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `

    const eventsBySource = await sql`
      SELECT source, COUNT(*) as count
      FROM webhook_events
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY source
    `

    const recentEvents = await sql`
      SELECT * FROM webhook_events
      ORDER BY created_at DESC
      LIMIT 10
    `

    return {
      total_events: Number.parseInt(stats.total_events),
      processed_events: Number.parseInt(stats.processed_events),
      failed_events: Number.parseInt(stats.failed_events),
      events_by_source: eventsBySource.reduce((acc: Record<string, number>, row: any) => {
        acc[row.source] = Number.parseInt(row.count)
        return acc
      }, {}),
      recent_events: recentEvents as WebhookEvent[],
    }
  }

  // Setup webhook configurations
  static async setupWebhook(
    config: Omit<WebhookConfig, "id" | "created_at" | "success_count" | "failure_count">,
  ): Promise<WebhookConfig> {
    const [webhook] = await sql`
      INSERT INTO webhook_configs (name, url, secret, events, active)
      VALUES (
        ${config.name},
        ${config.url},
        ${config.secret || null},
        ${JSON.stringify(config.events)},
        ${config.active}
      )
      RETURNING *
    `

    return webhook as WebhookConfig
  }

  // Test webhook
  static async testWebhook(webhookId: string): Promise<{ success: boolean; response?: any; error?: string }> {
    try {
      const [webhook] = await sql`
        SELECT * FROM webhook_configs WHERE id = ${webhookId}
      `

      if (!webhook) {
        throw new Error("Webhook not found")
      }

      const testPayload = {
        event: "test",
        timestamp: new Date().toISOString(),
        data: { message: "This is a test webhook" },
      }

      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Source": "drx3-api",
          ...(webhook.secret && { "X-Webhook-Signature": this.generateSignature(testPayload, webhook.secret) }),
        },
        body: JSON.stringify(testPayload),
      })

      if (response.ok) {
        await sql`
          UPDATE webhook_configs 
          SET success_count = success_count + 1, last_triggered = NOW()
          WHERE id = ${webhookId}
        `
        return { success: true, response: await response.text() }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      await sql`
        UPDATE webhook_configs 
        SET failure_count = failure_count + 1
        WHERE id = ${webhookId}
      `
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  private static generateSignature(payload: any, secret: string): string {
    const crypto = require("crypto")
    return "sha256=" + crypto.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex")
  }

  // Retry failed webhooks
  static async retryFailedWebhooks(): Promise<number> {
    const failedEvents = await sql`
      SELECT * FROM webhook_events
      WHERE processed = false 
        AND retry_count < 3
        AND created_at > NOW() - INTERVAL '24 hours'
      ORDER BY created_at ASC
      LIMIT 10
    `

    let retriedCount = 0

    for (const event of failedEvents) {
      try {
        if (event.source === "github") {
          await this.processGitHubWebhook(event.payload, event.headers)
        } else if (event.source === "vercel") {
          await this.processVercelWebhook(event.payload, event.headers)
        }
        retriedCount++
      } catch (error) {
        await sql`
          UPDATE webhook_events 
          SET retry_count = retry_count + 1,
              error_message = ${error instanceof Error ? error.message : "Unknown error"}
          WHERE id = ${event.id}
        `
      }
    }

    return retriedCount
  }
}

// Global webhook logger instance
export const globalWebhookLogger = {
  async log(event: string, data: any) {
    console.log(`[Webhook] ${event}:`, data)
    // Store in database if needed
    try {
      await WebhookHandler.storeEvent({
        type: event,
        source: "custom",
        payload: data,
        headers: {},
      })
    } catch (error) {
      console.error("Failed to log webhook event:", error)
    }
  },

  async getRecentLogs(limit = 50) {
    return WebhookHandler.getWebhookStats()
  },
}

// Webhook utilities
export const WebhookUtils = {
  validateSignature: WebhookHandler.generateSignature,

  async processEvent(type: string, payload: any, headers: Record<string, string>) {
    if (type.startsWith("github")) {
      return WebhookHandler.processGitHubWebhook(payload, headers)
    } else if (type.startsWith("vercel")) {
      return WebhookHandler.processVercelWebhook(payload, headers)
    }
    throw new Error(`Unsupported webhook type: ${type}`)
  },

  async retryFailed() {
    return WebhookHandler.retryFailedWebhooks()
  },
}

// Webhook configurations
export const webhookConfigs = {
  github: {
    events: ["push", "pull_request", "issues", "star"],
    secret: process.env.GITHUB_WEBHOOK_SECRET,
    active: true,
  },

  vercel: {
    events: ["deployment"],
    secret: process.env.VERCEL_WEBHOOK_SECRET,
    active: true,
  },

  async setup(name: string, url: string, events: string[]) {
    return WebhookHandler.setupWebhook({
      name,
      url,
      events,
      active: true,
    })
  },

  async test(webhookId: string) {
    return WebhookHandler.testWebhook(webhookId)
  },
}

// Export for use in API routes
export default WebhookHandler
