import { type NextRequest, NextResponse } from "next/server"
import { globalWebhookLogger, WebhookUtils, webhookConfigs, WebhookHandler } from "@/lib/webhook-handler"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headers = Object.fromEntries(request.headers.entries())

    // Verify GitHub signature if secret is configured
    const signature = headers["x-hub-signature-256"]
    const secret = process.env.GITHUB_WEBHOOK_SECRET

    if (secret && signature) {
      const isValid = WebhookUtils.validateSignature(body, signature, secret)
      if (!isValid) {
        console.error("❌ Invalid GitHub webhook signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const payload = JSON.parse(body)
    const event = headers["x-github-event"]
    const delivery = headers["x-github-delivery"]

    // Create webhook event
    const webhookEvent = {
      id: uuidv4(),
      type: `github.${event}`,
      timestamp: new Date().toISOString(),
      source: "github",
      data: payload,
      metadata: {
        userAgent: headers["user-agent"],
        delivery,
        event,
        signature: signature ? "verified" : "none",
        repository: payload.repository?.full_name,
        sender: payload.sender?.login,
      },
    }

    // Log the event
    globalWebhookLogger.log(webhookEvent)

    console.log(`🐙 GitHub ${event} webhook received (${delivery})`)

    let processingResult: any = {}

    // Process different GitHub events
    switch (event) {
      case "ping":
        processingResult = {
          success: true,
          message: "GitHub webhook ping received successfully",
          zen: payload.zen,
          hook_id: payload.hook?.id,
        }
        console.log(`✅ GitHub ping: ${payload.zen}`)
        break

      case "push":
        const branch = payload.ref?.replace("refs/heads/", "")
        const commits = payload.commits?.length || 0
        const pusher = payload.pusher?.name

        console.log(`📝 Push to ${branch} by ${pusher}: ${commits} commits`)

        // Auto-deploy on main branch
        if (branch === "main" && commits > 0) {
          console.log("🚀 Main branch push detected - triggering deployment")

          // Trigger Vercel deployment if deploy hook is configured
          if (process.env.VERCEL_DEPLOY_HOOK) {
            try {
              const deployResponse = await fetch(process.env.VERCEL_DEPLOY_HOOK, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ref: branch,
                  commits: payload.commits,
                  pusher: pusher,
                }),
              })

              if (deployResponse.ok) {
                console.log("✅ Vercel deployment triggered successfully")
              }
            } catch (deployError) {
              console.error("❌ Failed to trigger Vercel deployment:", deployError)
            }
          }

          processingResult = {
            success: true,
            message: `Push to main branch processed - auto-deployment triggered`,
            branch,
            commits,
            pusher,
            auto_deploy: true,
            commit_messages: payload.commits?.map((c: any) => c.message) || [],
          }
        } else {
          processingResult = {
            success: true,
            message: `Push to ${branch} processed`,
            branch,
            commits,
            pusher,
            auto_deploy: false,
          }
        }
        break

      case "pull_request":
        const action = payload.action
        const prNumber = payload.number
        const prTitle = payload.pull_request?.title
        const prUser = payload.pull_request?.user?.login

        console.log(`🔀 PR #${prNumber} ${action} by ${prUser}: "${prTitle}"`)

        processingResult = {
          success: true,
          message: `Pull request #${prNumber} ${action}`,
          action,
          number: prNumber,
          title: prTitle,
          user: prUser,
          mergeable: payload.pull_request?.mergeable,
          draft: payload.pull_request?.draft,
        }
        break

      case "issues":
        const issueAction = payload.action
        const issueNumber = payload.issue?.number
        const issueTitle = payload.issue?.title
        const issueUser = payload.issue?.user?.login

        console.log(`🐛 Issue #${issueNumber} ${issueAction} by ${issueUser}: "${issueTitle}"`)

        processingResult = {
          success: true,
          message: `Issue #${issueNumber} ${issueAction}`,
          action: issueAction,
          number: issueNumber,
          title: issueTitle,
          user: issueUser,
          state: payload.issue?.state,
        }
        break

      case "release":
        const releaseAction = payload.action
        const tagName = payload.release?.tag_name
        const releaseName = payload.release?.name
        const prerelease = payload.release?.prerelease

        console.log(`🏷️ Release ${tagName} ${releaseAction}: "${releaseName}"`)

        processingResult = {
          success: true,
          message: `Release ${tagName} ${releaseAction}`,
          action: releaseAction,
          tag: tagName,
          name: releaseName,
          prerelease,
          draft: payload.release?.draft,
        }
        break

      case "star":
        const starAction = payload.action
        const stargazer = payload.sender?.login
        const starCount = payload.repository?.stargazers_count

        console.log(`⭐ Repository ${starAction} by ${stargazer} (total: ${starCount})`)

        processingResult = {
          success: true,
          message: `Repository ${starAction} by ${stargazer}`,
          action: starAction,
          user: stargazer,
          total_stars: starCount,
        }
        break

      case "fork":
        const forker = payload.forkee?.owner?.login
        const forkName = payload.forkee?.full_name

        console.log(`🍴 Repository forked by ${forker}: ${forkName}`)

        processingResult = {
          success: true,
          message: `Repository forked by ${forker}`,
          forker,
          fork_name: forkName,
          forks_count: payload.repository?.forks_count,
        }
        break

      case "workflow_run":
        const workflowAction = payload.action
        const workflowName = payload.workflow_run?.name
        const workflowStatus = payload.workflow_run?.status
        const workflowConclusion = payload.workflow_run?.conclusion

        console.log(`⚙️ Workflow "${workflowName}" ${workflowAction}: ${workflowStatus}/${workflowConclusion}`)

        processingResult = {
          success: true,
          message: `Workflow "${workflowName}" ${workflowAction}`,
          action: workflowAction,
          name: workflowName,
          status: workflowStatus,
          conclusion: workflowConclusion,
        }
        break

      default:
        console.log(`📦 GitHub ${event} event processed`)
        processingResult = {
          success: true,
          message: `GitHub ${event} event processed`,
          event,
          repository: payload.repository?.full_name,
        }
    }

    // Forward to webhook.site for monitoring
    try {
      const webhookHandler = new WebhookHandler(webhookConfigs.webhookSite)
      await webhookHandler.send({
        source: "github",
        event,
        delivery,
        repository: payload.repository?.full_name,
        processing_result: processingResult,
        timestamp: webhookEvent.timestamp,
      })
    } catch (forwardError) {
      console.warn("Failed to forward GitHub webhook to webhook.site:", forwardError)
    }

    return NextResponse.json({
      success: true,
      message: "GitHub webhook processed successfully",
      event: {
        id: webhookEvent.id,
        type: `github.${event}`,
        delivery,
        timestamp: webhookEvent.timestamp,
      },
      processing: processingResult,
    })
  } catch (error) {
    console.error("GitHub webhook error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process GitHub webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "GitHub webhook endpoint is active",
    endpoint: "/api/webhooks/github",
    supported_events: ["ping", "push", "pull_request", "issues", "release", "star", "fork", "workflow_run"],
    setup_url: "https://github.com/wolfomani/3bdulaziz/settings/hooks",
    webhook_url: "https://3bdulaziz.vercel.app/api/webhooks/github",
    monitoring: "https://webhook.site/4f2e177c-931c-49c2-a095-ad4ee2684614",
  })
}
