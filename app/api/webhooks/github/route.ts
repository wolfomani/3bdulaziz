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
    const githubDelivery = headersList.get("x-github-delivery")
    const githubSignature = headersList.get("x-hub-signature-256")
    const userAgent = headersList.get("user-agent")

    if (!githubEvent) {
      return NextResponse.json({ error: "Missing X-GitHub-Event header" }, { status: 400 })
    }

    // Parse GitHub payload
    let payload
    try {
      payload = JSON.parse(body)
    } catch (error) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
    }

    // Verify GitHub signature if secret is configured
    if (process.env.GITHUB_WEBHOOK_SECRET && githubSignature) {
      const isValid = verifyGitHubSignature(body, githubSignature, process.env.GITHUB_WEBHOOK_SECRET)
      if (!isValid) {
        console.error("Invalid GitHub webhook signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
      console.log("GitHub webhook signature verified")
    }

    // Create webhook event for logging
    const webhookEvent: WebhookEvent = {
      id: githubDelivery || crypto.randomUUID(),
      type: `github.${githubEvent}`,
      timestamp: new Date().toISOString(),
      source: "github",
      data: {
        event: githubEvent,
        action: payload.action,
        repository: payload.repository,
        sender: payload.sender,
        payload: payload,
      },
      metadata: {
        userAgent: userAgent || undefined,
        delivery: githubDelivery || undefined,
        signature: githubSignature || undefined,
      },
    }

    // Log the GitHub webhook event
    globalWebhookLogger.log(webhookEvent)

    console.log("GitHub webhook received:", {
      event: githubEvent,
      action: payload.action,
      repository: payload.repository?.full_name,
      sender: payload.sender?.login,
    })

    // Forward to webhook.site for monitoring
    try {
      const webhookHandler = new WebhookHandler(webhookConfigs.webhookSite)
      await webhookHandler.send({
        ...webhookEvent,
        forwardedFrom: "drx3-github-webhook",
        repositoryInfo: {
          name: payload.repository?.full_name,
          private: payload.repository?.private,
          stars: payload.repository?.stargazers_count,
          forks: payload.repository?.forks_count,
        },
      })
    } catch (forwardError) {
      console.error("Failed to forward GitHub webhook:", forwardError)
    }

    // Process specific GitHub events
    let processingResult
    switch (githubEvent) {
      case "ping":
        processingResult = await handlePing(payload)
        break
      case "push":
        processingResult = await handlePush(payload)
        break
      case "pull_request":
        processingResult = await handlePullRequest(payload)
        break
      case "issues":
        processingResult = await handleIssues(payload)
        break
      case "issue_comment":
        processingResult = await handleIssueComment(payload)
        break
      case "release":
        processingResult = await handleRelease(payload)
        break
      case "star":
        processingResult = await handleStar(payload)
        break
      case "fork":
        processingResult = await handleFork(payload)
        break
      case "watch":
        processingResult = await handleWatch(payload)
        break
      case "repository":
        processingResult = await handleRepository(payload)
        break
      case "workflow_run":
        processingResult = await handleWorkflowRun(payload)
        break
      case "check_suite":
        processingResult = await handleCheckSuite(payload)
        break
      case "deployment":
        processingResult = await handleDeployment(payload)
        break
      case "deployment_status":
        processingResult = await handleDeploymentStatus(payload)
        break
      default:
        processingResult = await handleGenericEvent(githubEvent, payload)
    }

    return NextResponse.json({
      success: true,
      message: "GitHub webhook processed successfully",
      event: githubEvent,
      action: payload.action,
      repository: payload.repository?.full_name,
      id: webhookEvent.id,
      processing: processingResult,
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
    description: "GitHub webhook handler for repository events",
    supportedEvents: [
      "ping",
      "push",
      "pull_request",
      "issues",
      "issue_comment",
      "release",
      "star",
      "fork",
      "watch",
      "repository",
      "workflow_run",
      "check_suite",
      "deployment",
      "deployment_status",
    ],
    repository: "wolfomani/3bdulaziz",
    configuration: {
      signatureVerification: !!process.env.GITHUB_WEBHOOK_SECRET,
      forwardingEnabled: true,
      webhookSiteUrl: webhookConfigs.webhookSite.url,
    },
    recentEvents: recentGitHubEvents.length,
    lastEvent: recentGitHubEvents[0]?.timestamp || null,
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
    console.error("GitHub signature verification error:", error)
    return false
  }
}

// GitHub event handlers
async function handlePing(payload: any) {
  console.log("GitHub ping received:", {
    zen: payload.zen,
    hookId: payload.hook?.id,
    repository: payload.repository?.full_name,
  })

  return {
    handled: true,
    type: "ping",
    message: "Pong! GitHub webhook is configured correctly",
    zen: payload.zen,
  }
}

async function handlePush(payload: any) {
  const pushInfo = {
    repository: payload.repository.full_name,
    branch: payload.ref.replace("refs/heads/", ""),
    commits: payload.commits.length,
    pusher: payload.pusher.name,
    headCommit: {
      id: payload.head_commit.id,
      message: payload.head_commit.message,
      author: payload.head_commit.author.name,
      url: payload.head_commit.url,
    },
    compareUrl: payload.compare,
  }

  console.log("GitHub push event processed:", pushInfo)

  // Auto-deploy on main branch push
  if (pushInfo.branch === "main" && process.env.VERCEL_DEPLOY_HOOK) {
    try {
      console.log("Triggering Vercel deployment...")
      const response = await fetch(process.env.VERCEL_DEPLOY_HOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref: payload.ref,
          commit: payload.head_commit.id,
          message: payload.head_commit.message,
        }),
      })

      if (response.ok) {
        console.log("✅ Vercel deployment triggered successfully")
        pushInfo.deploymentTriggered = true
      } else {
        console.error("❌ Failed to trigger Vercel deployment:", response.status)
        pushInfo.deploymentTriggered = false
      }
    } catch (error) {
      console.error("❌ Error triggering deployment:", error)
      pushInfo.deploymentTriggered = false
    }
  }

  return { handled: true, type: "push", data: pushInfo }
}

async function handlePullRequest(payload: any) {
  const prInfo = {
    action: payload.action,
    number: payload.pull_request.number,
    title: payload.pull_request.title,
    state: payload.pull_request.state,
    author: payload.pull_request.user.login,
    baseBranch: payload.pull_request.base.ref,
    headBranch: payload.pull_request.head.ref,
    url: payload.pull_request.html_url,
    mergeable: payload.pull_request.mergeable,
    draft: payload.pull_request.draft,
  }

  console.log("GitHub pull request event processed:", prInfo)

  // Handle different PR actions
  switch (payload.action) {
    case "opened":
      console.log(`🔄 New PR opened: #${prInfo.number} - ${prInfo.title}`)
      break
    case "closed":
      if (payload.pull_request.merged) {
        console.log(`✅ PR merged: #${prInfo.number} - ${prInfo.title}`)
      } else {
        console.log(`❌ PR closed without merge: #${prInfo.number}`)
      }
      break
    case "synchronize":
      console.log(`🔄 PR updated: #${prInfo.number}`)
      break
  }

  return { handled: true, type: "pull_request", data: prInfo }
}

async function handleIssues(payload: any) {
  const issueInfo = {
    action: payload.action,
    number: payload.issue.number,
    title: payload.issue.title,
    state: payload.issue.state,
    author: payload.issue.user.login,
    assignees: payload.issue.assignees?.map((a: any) => a.login) || [],
    labels: payload.issue.labels?.map((l: any) => l.name) || [],
    url: payload.issue.html_url,
  }

  console.log("GitHub issues event processed:", issueInfo)

  switch (payload.action) {
    case "opened":
      console.log(`🐛 New issue opened: #${issueInfo.number} - ${issueInfo.title}`)
      break
    case "closed":
      console.log(`✅ Issue closed: #${issueInfo.number}`)
      break
    case "reopened":
      console.log(`🔄 Issue reopened: #${issueInfo.number}`)
      break
  }

  return { handled: true, type: "issues", data: issueInfo }
}

async function handleIssueComment(payload: any) {
  const commentInfo = {
    action: payload.action,
    issueNumber: payload.issue.number,
    issueTitle: payload.issue.title,
    commentAuthor: payload.comment.user.login,
    commentBody: payload.comment.body.substring(0, 100) + "...",
    commentUrl: payload.comment.html_url,
  }

  console.log("GitHub issue comment event processed:", commentInfo)
  return { handled: true, type: "issue_comment", data: commentInfo }
}

async function handleRelease(payload: any) {
  const releaseInfo = {
    action: payload.action,
    tagName: payload.release.tag_name,
    name: payload.release.name,
    body: payload.release.body?.substring(0, 200) + "...",
    prerelease: payload.release.prerelease,
    draft: payload.release.draft,
    author: payload.release.author.login,
    url: payload.release.html_url,
    downloadUrl: payload.release.tarball_url,
  }

  console.log("GitHub release event processed:", releaseInfo)

  if (payload.action === "published") {
    console.log(`🚀 New release published: ${releaseInfo.tagName} - ${releaseInfo.name}`)
  }

  return { handled: true, type: "release", data: releaseInfo }
}

async function handleStar(payload: any) {
  const starInfo = {
    action: payload.action,
    starrer: payload.sender.login,
    repository: payload.repository.full_name,
    totalStars: payload.repository.stargazers_count,
  }

  console.log("GitHub star event processed:", starInfo)

  if (payload.action === "created") {
    console.log(`⭐ New star from ${starInfo.starrer}! Total: ${starInfo.totalStars}`)
  }

  return { handled: true, type: "star", data: starInfo }
}

async function handleFork(payload: any) {
  const forkInfo = {
    forker: payload.sender.login,
    repository: payload.repository.full_name,
    forkName: payload.forkee.full_name,
    totalForks: payload.repository.forks_count,
    forkUrl: payload.forkee.html_url,
  }

  console.log("GitHub fork event processed:", forkInfo)
  console.log(`🍴 Repository forked by ${forkInfo.forker}! Total forks: ${forkInfo.totalForks}`)

  return { handled: true, type: "fork", data: forkInfo }
}

async function handleWatch(payload: any) {
  const watchInfo = {
    action: payload.action,
    watcher: payload.sender.login,
    repository: payload.repository.full_name,
    totalWatchers: payload.repository.watchers_count,
  }

  console.log("GitHub watch event processed:", watchInfo)
  return { handled: true, type: "watch", data: watchInfo }
}

async function handleRepository(payload: any) {
  const repoInfo = {
    action: payload.action,
    repository: payload.repository.full_name,
    description: payload.repository.description,
    private: payload.repository.private,
    language: payload.repository.language,
    topics: payload.repository.topics,
  }

  console.log("GitHub repository event processed:", repoInfo)
  return { handled: true, type: "repository", data: repoInfo }
}

async function handleWorkflowRun(payload: any) {
  const workflowInfo = {
    action: payload.action,
    workflowName: payload.workflow_run.name,
    status: payload.workflow_run.status,
    conclusion: payload.workflow_run.conclusion,
    branch: payload.workflow_run.head_branch,
    actor: payload.workflow_run.actor.login,
    url: payload.workflow_run.html_url,
  }

  console.log("GitHub workflow run event processed:", workflowInfo)

  if (payload.action === "completed") {
    const status = workflowInfo.conclusion === "success" ? "✅" : "❌"
    console.log(`${status} Workflow "${workflowInfo.workflowName}" ${workflowInfo.conclusion}`)
  }

  return { handled: true, type: "workflow_run", data: workflowInfo }
}

async function handleCheckSuite(payload: any) {
  const checkInfo = {
    action: payload.action,
    status: payload.check_suite.status,
    conclusion: payload.check_suite.conclusion,
    headBranch: payload.check_suite.head_branch,
    headSha: payload.check_suite.head_sha,
    url: payload.check_suite.url,
  }

  console.log("GitHub check suite event processed:", checkInfo)
  return { handled: true, type: "check_suite", data: checkInfo }
}

async function handleDeployment(payload: any) {
  const deploymentInfo = {
    action: payload.action,
    environment: payload.deployment.environment,
    ref: payload.deployment.ref,
    sha: payload.deployment.sha,
    creator: payload.deployment.creator.login,
    url: payload.deployment.url,
  }

  console.log("GitHub deployment event processed:", deploymentInfo)
  return { handled: true, type: "deployment", data: deploymentInfo }
}

async function handleDeploymentStatus(payload: any) {
  const statusInfo = {
    action: payload.action,
    state: payload.deployment_status.state,
    environment: payload.deployment_status.environment,
    targetUrl: payload.deployment_status.target_url,
    description: payload.deployment_status.description,
  }

  console.log("GitHub deployment status event processed:", statusInfo)
  return { handled: true, type: "deployment_status", data: statusInfo }
}

async function handleGenericEvent(eventType: string, payload: any) {
  console.log(`GitHub ${eventType} event received (generic handler)`)
  return {
    handled: true,
    type: eventType,
    message: `Generic handler processed ${eventType} event`,
    data: {
      action: payload.action,
      sender: payload.sender?.login,
      repository: payload.repository?.full_name,
    },
  }
}
