import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { WebhookHandler, webhookConfigs } from "@/lib/webhook-handler"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = headers()

    // Get GitHub webhook headers
    const githubEvent = headersList.get("x-github-event")
    const githubSignature = headersList.get("x-hub-signature-256")
    const githubDelivery = headersList.get("x-github-delivery")

    // Parse GitHub payload
    let payload
    try {
      payload = JSON.parse(body)
    } catch (error) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
    }

    // Log GitHub webhook data
    const webhookData = {
      id: githubDelivery || crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      event: githubEvent,
      signature: githubSignature,
      repository: payload.repository?.full_name,
      sender: payload.sender?.login,
      action: payload.action,
      payload: payload,
    }

    console.log("GitHub webhook received:", webhookData)

    // Forward to webhook.site for monitoring
    try {
      await fetch("https://webhook.site/4f2e177c-931c-49c2-a095-ad4ee2684614", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-GitHub-Event": githubEvent || "unknown",
          "X-Forwarded-From": "drx3-github-webhook",
        },
        body: JSON.stringify(webhookData),
      })
    } catch (forwardError) {
      console.error("Failed to forward GitHub webhook:", forwardError)
    }

    // Handle specific GitHub events
    switch (githubEvent) {
      case "push":
        await handlePushEvent(payload)
        break
      case "pull_request":
        await handlePullRequestEvent(payload)
        break
      case "issues":
        await handleIssuesEvent(payload)
        break
      case "release":
        await handleReleaseEvent(payload)
        break
      default:
        console.log(`Unhandled GitHub event: ${githubEvent}`)
    }

    // Handle GitHub webhook events
    const githubHandler = new WebhookHandler(webhookConfigs.github)

    const drx3WebhookData = {
      event_type: "drx3_api_event",
      client_payload: {
        source: "drx3-api",
        timestamp: new Date().toISOString(),
        data: payload,
      },
    }

    const success = await githubHandler.send(drx3WebhookData, {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    })

    if (success) {
      return NextResponse.json({
        success: true,
        message: "GitHub webhook processed successfully",
        event: githubEvent,
        repository: payload.repository?.full_name,
        id: webhookData.id,
      })
    } else {
      return NextResponse.json({ error: "Failed to send GitHub webhook" }, { status: 500 })
    }
  } catch (error) {
    console.error("GitHub webhook processing error:", error)
    return NextResponse.json({ error: "GitHub webhook processing failed" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    endpoint: "/api/webhooks/github",
    description: "GitHub webhook handler for drx3 repository events",
    supportedEvents: ["push", "pull_request", "issues", "release"],
    repository: "wolfomani/3bdulaziz",
    timestamp: new Date().toISOString(),
  })
}

async function handlePushEvent(payload: any) {
  console.log("Processing push event:", {
    repository: payload.repository.full_name,
    branch: payload.ref,
    commits: payload.commits?.length || 0,
    pusher: payload.pusher.name,
  })

  // Trigger deployment or other actions based on push
  if (payload.ref === "refs/heads/main") {
    console.log("Push to main branch detected - triggering deployment")
    // Add deployment logic here
  }
}

async function handlePullRequestEvent(payload: any) {
  console.log("Processing pull request event:", {
    action: payload.action,
    number: payload.number,
    title: payload.pull_request.title,
    author: payload.pull_request.user.login,
  })

  // Handle PR actions (opened, closed, merged, etc.)
  if (payload.action === "opened") {
    console.log("New pull request opened")
    // Add PR notification logic here
  }
}

async function handleIssuesEvent(payload: any) {
  console.log("Processing issues event:", {
    action: payload.action,
    number: payload.issue.number,
    title: payload.issue.title,
    author: payload.issue.user.login,
  })

  // Handle issue actions
  if (payload.action === "opened") {
    console.log("New issue created")
    // Add issue notification logic here
  }
}

async function handleReleaseEvent(payload: any) {
  console.log("Processing release event:", {
    action: payload.action,
    tag: payload.release.tag_name,
    name: payload.release.name,
    author: payload.release.author.login,
  })

  // Handle release actions
  if (payload.action === "published") {
    console.log("New release published")
    // Add release notification logic here
  }
}
