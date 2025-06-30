import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { WebhookHandler, webhookConfigs, globalWebhookLogger, type WebhookEvent } from "@/lib/webhook-handler"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = headers()

    // Get request headers
    const userAgent = headersList.get("user-agent")
    const contentType = headersList.get("content-type")
    const signature = headersList.get("x-hub-signature-256") || headersList.get("x-signature")
    const githubEvent = headersList.get("x-github-event")
    const githubDelivery = headersList.get("x-github-delivery")

    // Parse payload
    let payload
    try {
      payload = JSON.parse(body)
    } catch (error) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
    }

    // Determine webhook source
    let source = "unknown"
    let eventType = "webhook.received"

    if (githubEvent) {
      source = "github"
      eventType = `github.${githubEvent}`
    } else if (userAgent?.includes("Vercel")) {
      source = "vercel"
      eventType = `vercel.${payload.type || "deployment"}`
    } else if (payload.type) {
      eventType = payload.type
    }

    // Create webhook event
    const webhookEvent: WebhookEvent = {
      id: githubDelivery || crypto.randomUUID(),
      type: eventType,
      timestamp: new Date().toISOString(),
      source,
      data: payload,
      metadata: {
        userAgent: userAgent || undefined,
        contentType: contentType || undefined,
        signature: signature || undefined,
        delivery: githubDelivery || undefined,
      },
    }

    // Log the webhook event
    globalWebhookLogger.log(webhookEvent)

    console.log("Webhook received:", {
      source,
      type: eventType,
      id: webhookEvent.id,
      userAgent,
    })

    // Verify signature if present
    if (signature && process.env.GITHUB_WEBHOOK_SECRET) {
      const isValid = verifyGitHubSignature(body, signature, process.env.GITHUB_WEBHOOK_SECRET)
      if (!isValid) {
        console.error("Invalid webhook signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
      console.log("Webhook signature verified successfully")
    }

    // Forward to webhook.site for monitoring
    try {
      const webhookHandler = new WebhookHandler(webhookConfigs.webhookSite)
      await webhookHandler.send({
        ...webhookEvent,
        forwardedFrom: "drx3-main-webhook",
        originalHeaders: {
          userAgent,
          contentType,
          githubEvent,
        },
      })
      console.log("Webhook forwarded to monitoring site")
    } catch (forwardError) {
      console.error("Failed to forward webhook:", forwardError)
    }

    // Process webhook based on source
    let processingResult
    switch (source) {
      case "github":
        processingResult = await processGitHubWebhook(payload, githubEvent!)
        break
      case "vercel":
        processingResult = await processVercelWebhook(payload)
        break
      default:
        processingResult = await processGenericWebhook(payload)
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
      event: {
        id: webhookEvent.id,
        type: webhookEvent.type,
        source: webhookEvent.source,
        timestamp: webhookEvent.timestamp,
      },
      processing: processingResult,
      forwarded: true,
    })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Webhook processing failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  const recentEvents = globalWebhookLogger.getEvents().slice(0, 10)
  const stats = {
    totalEvents: globalWebhookLogger.getEvents().length,
    recentEvents: recentEvents.length,
    lastEvent: recentEvents[0]?.timestamp || null,
    sources: [...new Set(globalWebhookLogger.getEvents().map((e) => e.source))],
    types: [...new Set(globalWebhookLogger.getEvents().map((e) => e.type))],
  }

  return NextResponse.json({
    status: "active",
    endpoint: "/api/webhooks",
    description: "Main webhook handler for Dr X API",
    supportedSources: ["github", "vercel", "generic"],
    configuration: {
      signatureVerification: !!process.env.GITHUB_WEBHOOK_SECRET,
      forwardingEnabled: true,
      webhookSiteUrl: webhookConfigs.webhookSite.url,
    },
    statistics: stats,
    endpoints: {
      main: "/api/webhooks",
      test: "/api/webhooks/test",
      github: "/api/webhooks/github",
      vercel: "/api/webhooks/vercel",
      events: "/api/webhooks/events",
      stats: "/api/webhooks/stats",
      setup: "/api/webhooks/setup",
    },
    timestamp: new Date().toISOString(),
  })
}

// GitHub signature verification
function verifyGitHubSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const hmac = crypto.createHmac("sha256", secret)
    hmac.update(payload, "utf8")
    const expectedSignature = `sha256=${hmac.digest("hex")}`
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  } catch (error) {
    console.error("Signature verification error:", error)
    return false
  }
}

// GitHub webhook processor
async function processGitHubWebhook(payload: any, eventType: string) {
  console.log(`Processing GitHub ${eventType} event`)

  switch (eventType) {
    case "push":
      return await processGitHubPush(payload)
    case "pull_request":
      return await processGitHubPullRequest(payload)
    case "issues":
      return await processGitHubIssues(payload)
    case "release":
      return await processGitHubRelease(payload)
    case "star":
      return await processGitHubStar(payload)
    case "fork":
      return await processGitHubFork(payload)
    case "repository":
      return await processGitHubRepository(payload)
    default:
      console.log(`Unhandled GitHub event: ${eventType}`)
      return { handled: false, eventType }
  }
}

async function processGitHubPush(payload: any) {
  const pushInfo = {
    repository: payload.repository?.full_name,
    branch: payload.ref?.replace("refs/heads/", ""),
    commits: payload.commits?.length || 0,
    pusher: payload.pusher?.name,
    headCommit: payload.head_commit?.message,
  }

  console.log("GitHub Push Event:", pushInfo)

  // Trigger deployment if push to main branch
  if (pushInfo.branch === "main" && process.env.VERCEL_DEPLOY_HOOK) {
    try {
      await fetch(process.env.VERCEL_DEPLOY_HOOK, { method: "POST" })
      console.log("Triggered Vercel deployment")
    } catch (error) {
      console.error("Failed to trigger deployment:", error)
    }
  }

  return { handled: true, type: "push", data: pushInfo }
}

async function processGitHubPullRequest(payload: any) {
  const prInfo = {
    action: payload.action,
    number: payload.pull_request?.number,
    title: payload.pull_request?.title,
    author: payload.pull_request?.user?.login,
    state: payload.pull_request?.state,
  }

  console.log("GitHub Pull Request Event:", prInfo)
  return { handled: true, type: "pull_request", data: prInfo }
}

async function processGitHubIssues(payload: any) {
  const issueInfo = {
    action: payload.action,
    number: payload.issue?.number,
    title: payload.issue?.title,
    author: payload.issue?.user?.login,
    state: payload.issue?.state,
  }

  console.log("GitHub Issues Event:", issueInfo)
  return { handled: true, type: "issues", data: issueInfo }
}

async function processGitHubRelease(payload: any) {
  const releaseInfo = {
    action: payload.action,
    tagName: payload.release?.tag_name,
    name: payload.release?.name,
    prerelease: payload.release?.prerelease,
    author: payload.release?.author?.login,
  }

  console.log("GitHub Release Event:", releaseInfo)
  return { handled: true, type: "release", data: releaseInfo }
}

async function processGitHubStar(payload: any) {
  const starInfo = {
    action: payload.action,
    starrer: payload.sender?.login,
    repository: payload.repository?.full_name,
    totalStars: payload.repository?.stargazers_count,
  }

  console.log("GitHub Star Event:", starInfo)
  return { handled: true, type: "star", data: starInfo }
}

async function processGitHubFork(payload: any) {
  const forkInfo = {
    forker: payload.sender?.login,
    repository: payload.repository?.full_name,
    forkName: payload.forkee?.full_name,
    totalForks: payload.repository?.forks_count,
  }

  console.log("GitHub Fork Event:", forkInfo)
  return { handled: true, type: "fork", data: forkInfo }
}

async function processGitHubRepository(payload: any) {
  const repoInfo = {
    action: payload.action,
    repository: payload.repository?.full_name,
    description: payload.repository?.description,
    private: payload.repository?.private,
  }

  console.log("GitHub Repository Event:", repoInfo)
  return { handled: true, type: "repository", data: repoInfo }
}

// Vercel webhook processor
async function processVercelWebhook(payload: any) {
  const deploymentInfo = {
    type: payload.type,
    url: payload.deployment?.url,
    state: payload.deployment?.state,
    project: payload.project?.name,
  }

  console.log("Vercel Deployment Event:", deploymentInfo)
  return { handled: true, type: "vercel_deployment", data: deploymentInfo }
}

// Generic webhook processor
async function processGenericWebhook(payload: any) {
  console.log("Processing generic webhook:", payload)
  return { handled: true, type: "generic", data: payload }
}
