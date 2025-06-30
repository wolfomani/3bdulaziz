import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { WebhookHandler, webhookConfigs, globalWebhookLogger, type WebhookEvent } from "@/lib/webhook-handler"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = headers()

    // Get GitHub webhook headers
    const githubEvent = headersList.get("x-github-event")
    const githubSignature = headersList.get("x-hub-signature-256")
    const githubDelivery = headersList.get("x-github-delivery")
    const userAgent = headersList.get("user-agent")

    // Verify GitHub webhook signature if secret is provided
    if (process.env.GITHUB_WEBHOOK_SECRET && githubSignature) {
      const expectedSignature = `sha256=${crypto
        .createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET)
        .update(body)
        .digest("hex")}`

      if (githubSignature !== expectedSignature) {
        console.error("GitHub webhook signature verification failed")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    // Parse GitHub payload
    let payload
    try {
      payload = JSON.parse(body)
    } catch (error) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
    }

    // Create webhook event for logging
    const webhookEvent: WebhookEvent = {
      id: githubDelivery || crypto.randomUUID(),
      type: `github.${githubEvent}`,
      timestamp: new Date().toISOString(),
      source: "github",
      data: {
        event: githubEvent,
        repository: payload.repository?.full_name,
        sender: payload.sender?.login,
        action: payload.action,
        payload: payload,
      },
      metadata: {
        userAgent: userAgent || undefined,
        signature: githubSignature || undefined,
      },
    }

    // Log the GitHub webhook event
    globalWebhookLogger.log(webhookEvent)

    console.log("GitHub webhook received:", {
      event: githubEvent,
      repository: payload.repository?.full_name,
      sender: payload.sender?.login,
      action: payload.action,
    })

    // Forward to webhook.site for monitoring
    try {
      const webhookHandler = new WebhookHandler(webhookConfigs.webhookSite)
      await webhookHandler.send({
        ...webhookEvent,
        forwardedFrom: "drx3-github-webhook",
        githubEvent,
        repository: payload.repository?.full_name,
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
      case "star":
        await handleStarEvent(payload)
        break
      case "fork":
        await handleForkEvent(payload)
        break
      case "watch":
        await handleWatchEvent(payload)
        break
      case "repository":
        await handleRepositoryEvent(payload)
        break
      default:
        console.log(`Unhandled GitHub event: ${githubEvent}`)
        await handleUnknownGitHubEvent(payload, githubEvent)
    }

    return NextResponse.json({
      success: true,
      message: "GitHub webhook processed successfully",
      event: githubEvent,
      repository: payload.repository?.full_name,
      id: webhookEvent.id,
      timestamp: webhookEvent.timestamp,
    })
  } catch (error) {
    console.error("GitHub webhook processing error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "GitHub webhook processing failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  const recentGitHubEvents = globalWebhookLogger
    .getEvents()
    .filter((event) => event.source === "github")
    .slice(0, 10)

  return NextResponse.json({
    status: "active",
    endpoint: "/api/webhooks/github",
    description: "GitHub webhook handler for drx3 repository events",
    supportedEvents: ["push", "pull_request", "issues", "release", "star", "fork", "watch", "repository"],
    repository: "wolfomani/3bdulaziz",
    recentEvents: recentGitHubEvents.length,
    lastEvent: recentGitHubEvents[0]?.timestamp || null,
    configuration: {
      signatureVerification: !!process.env.GITHUB_WEBHOOK_SECRET,
      forwardingEnabled: true,
    },
    timestamp: new Date().toISOString(),
  })
}

// GitHub event handlers
async function handlePushEvent(payload: any) {
  const pushInfo = {
    repository: payload.repository.full_name,
    branch: payload.ref.replace("refs/heads/", ""),
    commits: payload.commits?.length || 0,
    pusher: payload.pusher.name,
    headCommit: payload.head_commit?.message,
  }

  console.log("Processing GitHub push event:", pushInfo)

  // Trigger deployment if push to main branch
  if (pushInfo.branch === "main") {
    console.log("Push to main branch detected - triggering deployment")

    // Trigger Vercel deployment webhook if configured
    if (process.env.VERCEL_DEPLOY_HOOK) {
      try {
        await fetch(process.env.VERCEL_DEPLOY_HOOK, { method: "POST" })
        console.log("Vercel deployment triggered")
      } catch (error) {
        console.error("Failed to trigger Vercel deployment:", error)
      }
    }
  }

  // Log commit information
  if (payload.commits && payload.commits.length > 0) {
    payload.commits.forEach((commit: any, index: number) => {
      console.log(`Commit ${index + 1}:`, {
        id: commit.id.substring(0, 7),
        message: commit.message,
        author: commit.author.name,
        timestamp: commit.timestamp,
      })
    })
  }
}

async function handlePullRequestEvent(payload: any) {
  const prInfo = {
    action: payload.action,
    number: payload.number,
    title: payload.pull_request.title,
    author: payload.pull_request.user.login,
    state: payload.pull_request.state,
    baseBranch: payload.pull_request.base.ref,
    headBranch: payload.pull_request.head.ref,
  }

  console.log("Processing GitHub pull request event:", prInfo)

  switch (payload.action) {
    case "opened":
      console.log("New pull request opened - consider running CI/CD checks")
      break
    case "closed":
      if (payload.pull_request.merged) {
        console.log("Pull request merged - consider triggering deployment")
      } else {
        console.log("Pull request closed without merging")
      }
      break
    case "synchronize":
      console.log("Pull request updated - consider re-running checks")
      break
  }
}

async function handleIssuesEvent(payload: any) {
  const issueInfo = {
    action: payload.action,
    number: payload.issue.number,
    title: payload.issue.title,
    author: payload.issue.user.login,
    state: payload.issue.state,
    labels: payload.issue.labels?.map((label: any) => label.name) || [],
  }

  console.log("Processing GitHub issues event:", issueInfo)

  if (payload.action === "opened") {
    console.log("New issue created - consider sending notification")
  }
}

async function handleReleaseEvent(payload: any) {
  const releaseInfo = {
    action: payload.action,
    tag: payload.release.tag_name,
    name: payload.release.name,
    author: payload.release.author.login,
    prerelease: payload.release.prerelease,
    draft: payload.release.draft,
  }

  console.log("Processing GitHub release event:", releaseInfo)

  if (payload.action === "published" && !payload.release.draft) {
    console.log("New release published - consider updating changelog or notifications")
  }
}

async function handleStarEvent(payload: any) {
  const starInfo = {
    action: payload.action,
    starrer: payload.sender.login,
    repository: payload.repository.full_name,
    totalStars: payload.repository.stargazers_count,
  }

  console.log("Processing GitHub star event:", starInfo)

  if (payload.action === "created") {
    console.log(`Repository starred by ${starInfo.starrer} - Total stars: ${starInfo.totalStars}`)
  }
}

async function handleForkEvent(payload: any) {
  const forkInfo = {
    forker: payload.sender.login,
    originalRepo: payload.repository.full_name,
    forkRepo: payload.forkee.full_name,
    totalForks: payload.repository.forks_count,
  }

  console.log("Processing GitHub fork event:", forkInfo)
  console.log(`Repository forked by ${forkInfo.forker} - Total forks: ${forkInfo.totalForks}`)
}

async function handleWatchEvent(payload: any) {
  const watchInfo = {
    action: payload.action,
    watcher: payload.sender.login,
    repository: payload.repository.full_name,
  }

  console.log("Processing GitHub watch event:", watchInfo)

  if (payload.action === "started") {
    console.log(`Repository watched by ${watchInfo.watcher}`)
  }
}

async function handleRepositoryEvent(payload: any) {
  const repoInfo = {
    action: payload.action,
    repository: payload.repository.full_name,
    owner: payload.repository.owner.login,
    visibility: payload.repository.visibility,
  }

  console.log("Processing GitHub repository event:", repoInfo)

  switch (payload.action) {
    case "created":
      console.log("Repository created")
      break
    case "deleted":
      console.log("Repository deleted")
      break
    case "publicized":
      console.log("Repository made public")
      break
    case "privatized":
      console.log("Repository made private")
      break
  }
}

async function handleUnknownGitHubEvent(payload: any, eventType: string | null) {
  console.log("Processing unknown GitHub event:", {
    eventType,
    repository: payload.repository?.full_name,
    sender: payload.sender?.login,
    action: payload.action,
  })
}
