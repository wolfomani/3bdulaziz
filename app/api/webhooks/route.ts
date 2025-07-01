import { type NextRequest, NextResponse } from "next/server"
import { WebhookHandler, globalWebhookLogger, WebhookUtils } from "@/lib/webhook-handler"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const headers = Object.fromEntries(request.headers.entries())

    // Determine webhook source
    let source = "generic"
    let eventType = "webhook.received"

    if (headers["x-github-event"]) {
      source = "github"
      eventType = `github.${headers["x-github-event"]}`
    } else if (headers["x-vercel-signature"]) {
      source = "vercel"
      eventType = "vercel.deployment"
    }

    // Create webhook event
    const webhookEvent = {
      id: uuidv4(),
      type: eventType,
      timestamp: new Date().toISOString(),
      source,
      data: body,
      metadata: WebhookUtils.extractMetadata(request),
    }

    // Log the event
    globalWebhookLogger.log(webhookEvent)

    // Process based on source
    let processingResult: any = {}

    try {
      if (source === "github") {
        processingResult = await processGitHubWebhook(headers, body)
      } else if (source === "vercel") {
        processingResult = await processVercelWebhook(headers, body)
      } else {
        processingResult = await processGenericWebhook(headers, body)
      }
    } catch (processingError) {
      console.error("Webhook processing error:", processingError)
      processingResult = {
        success: false,
        error: processingError instanceof Error ? processingError.message : "Processing failed",
      }
    }

    // Forward to webhook.site for monitoring
    try {
      const webhookHandler = new WebhookHandler({
        url: "https://webhook.site/4f2e177c-931c-49c2-a095-ad4ee2684614",
        retryAttempts: 1,
        timeout: 5000,
      })

      await webhookHandler.send({
        source,
        event_type: eventType,
        timestamp: webhookEvent.timestamp,
        processing_result: processingResult,
        original_payload: body,
      })
    } catch (forwardError) {
      console.warn("Failed to forward to webhook.site:", forwardError)
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
      event: {
        id: webhookEvent.id,
        type: eventType,
        source,
        timestamp: webhookEvent.timestamp,
      },
      processing: processingResult,
    })
  } catch (error) {
    console.error("Main webhook handler error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function processGitHubWebhook(headers: Record<string, string>, payload: any) {
  const event = headers["x-github-event"]
  const delivery = headers["x-github-delivery"]

  console.log(`🐙 GitHub ${event} event received (${delivery})`)

  switch (event) {
    case "ping":
      return {
        success: true,
        message: "GitHub webhook ping received",
        zen: payload.zen,
      }

    case "push":
      const branch = payload.ref?.replace("refs/heads/", "")
      const commits = payload.commits?.length || 0

      console.log(`📝 Push to ${branch}: ${commits} commits`)

      // Auto-deploy on main branch push
      if (branch === "main" && commits > 0) {
        console.log("🚀 Triggering auto-deployment for main branch")
        return {
          success: true,
          message: `Push to main branch processed - ${commits} commits`,
          branch,
          commits,
          auto_deploy: true,
        }
      }

      return {
        success: true,
        message: `Push to ${branch} processed`,
        branch,
        commits,
      }

    case "pull_request":
      const action = payload.action
      const prNumber = payload.number
      const prTitle = payload.pull_request?.title

      console.log(`🔀 Pull Request #${prNumber}: ${action} - "${prTitle}"`)

      return {
        success: true,
        message: `Pull request #${prNumber} ${action}`,
        action,
        number: prNumber,
        title: prTitle,
      }

    case "issues":
      const issueAction = payload.action
      const issueNumber = payload.issue?.number
      const issueTitle = payload.issue?.title

      console.log(`🐛 Issue #${issueNumber}: ${issueAction} - "${issueTitle}"`)

      return {
        success: true,
        message: `Issue #${issueNumber} ${issueAction}`,
        action: issueAction,
        number: issueNumber,
        title: issueTitle,
      }

    case "release":
      const releaseAction = payload.action
      const tagName = payload.release?.tag_name
      const releaseName = payload.release?.name

      console.log(`🏷️ Release ${tagName}: ${releaseAction} - "${releaseName}"`)

      return {
        success: true,
        message: `Release ${tagName} ${releaseAction}`,
        action: releaseAction,
        tag: tagName,
        name: releaseName,
      }

    case "star":
      const starAction = payload.action
      const stargazer = payload.sender?.login

      console.log(`⭐ Repository ${starAction} by ${stargazer}`)

      return {
        success: true,
        message: `Repository ${starAction} by ${stargazer}`,
        action: starAction,
        user: stargazer,
      }

    default:
      console.log(`📦 GitHub ${event} event processed`)
      return {
        success: true,
        message: `GitHub ${event} event processed`,
        event,
      }
  }
}

async function processVercelWebhook(headers: Record<string, string>, payload: any) {
  const deploymentUrl = payload.deployment?.url
  const projectName = payload.project?.name
  const deploymentState = payload.deployment?.state

  console.log(`▲ Vercel deployment: ${deploymentState} - ${deploymentUrl}`)

  return {
    success: true,
    message: `Vercel deployment ${deploymentState}`,
    deployment: {
      url: deploymentUrl,
      project: projectName,
      state: deploymentState,
    },
  }
}

async function processGenericWebhook(headers: Record<string, string>, payload: any) {
  console.log("🔗 Generic webhook processed")

  return {
    success: true,
    message: "Generic webhook processed",
    payload_size: JSON.stringify(payload).length,
    headers_count: Object.keys(headers).length,
  }
}

export async function GET() {
  try {
    const stats = globalWebhookLogger.getStatistics()

    return NextResponse.json({
      message: "Webhook system is operational",
      endpoints: {
        main: "/api/webhooks",
        github: "/api/webhooks/github",
        vercel: "/api/webhooks/vercel",
        test: "/api/webhooks/test",
        events: "/api/webhooks/events",
        stats: "/api/webhooks/stats",
        setup: "/api/webhooks/setup",
      },
      statistics: stats,
      monitoring: {
        webhook_site: "https://webhook.site/4f2e177c-931c-49c2-a095-ad4ee2684614",
        management_ui: "/webhooks",
      },
    })
  } catch (error) {
    console.error("Webhook system status error:", error)
    return NextResponse.json({ error: "Failed to get webhook system status" }, { status: 500 })
  }
}
