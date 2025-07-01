import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import crypto from "crypto"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-hub-signature-256")
    const event = request.headers.get("x-github-event")
    const delivery = request.headers.get("x-github-delivery")

    console.log(`🐙 GitHub ${event} webhook received (${delivery})`)

    // Verify signature if secret is configured
    if (process.env.GITHUB_WEBHOOK_SECRET && signature) {
      const expectedSignature = `sha256=${crypto
        .createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET)
        .update(body)
        .digest("hex")}`

      if (signature !== expectedSignature) {
        console.error("❌ Invalid GitHub webhook signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const payload = JSON.parse(body)

    // Store webhook event
    try {
      await sql`
        INSERT INTO webhook_events (type, source, payload, headers, processed)
        VALUES (
          ${event},
          'github',
          ${JSON.stringify(payload)},
          ${JSON.stringify(Object.fromEntries(request.headers.entries()))},
          true
        )
      `
    } catch (dbError) {
      console.warn("Failed to store webhook event:", dbError)
    }

    // Process different GitHub events
    let processingResult: any = {}

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

        processingResult = {
          success: true,
          message: `Push to ${branch} processed`,
          branch,
          commits,
          pusher,
          repository: payload.repository?.full_name,
        }

        // Auto-deploy on main branch
        if (branch === "main" && commits > 0 && process.env.VERCEL_DEPLOY_HOOK) {
          try {
            await fetch(process.env.VERCEL_DEPLOY_HOOK, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ref: branch,
                commits: payload.commits,
                pusher: pusher,
              }),
            })
            console.log("🚀 Vercel deployment triggered")
            processingResult.auto_deploy = true
          } catch (deployError) {
            console.error("❌ Failed to trigger deployment:", deployError)
          }
        }
        break

      case "pull_request":
        const action = payload.action
        const prNumber = payload.number
        const prTitle = payload.pull_request?.title

        console.log(`🔀 PR #${prNumber} ${action}: "${prTitle}"`)

        processingResult = {
          success: true,
          message: `Pull request #${prNumber} ${action}`,
          action,
          number: prNumber,
          title: prTitle,
        }
        break

      default:
        console.log(`📦 GitHub ${event} event processed`)
        processingResult = {
          success: true,
          message: `GitHub ${event} event processed`,
          event,
        }
    }

    // Forward to webhook.site for monitoring
    try {
      await fetch("https://webhook.site/b9656a38-2592-49ef-98c9-e16ccff6134a", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Source": "drx3-api",
        },
        body: JSON.stringify({
          source: "github",
          event,
          delivery,
          repository: payload.repository?.full_name,
          processing_result: processingResult,
          timestamp: new Date().toISOString(),
          payload: payload,
        }),
      })
      console.log("✅ Forwarded to webhook.site")
    } catch (forwardError) {
      console.warn("Failed to forward to webhook.site:", forwardError)
    }

    return NextResponse.json({
      success: true,
      message: "GitHub webhook processed successfully",
      event: {
        type: `github.${event}`,
        delivery,
        timestamp: new Date().toISOString(),
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
    supported_events: ["ping", "push", "pull_request", "issues", "release", "star", "fork"],
    webhook_url: "https://v0-drx3apipage2-git-main-balqees0alalawi-gmailcoms-projects.vercel.app/api/webhooks/github",
    monitoring: "https://webhook.site/b9656a38-2592-49ef-98c9-e16ccff6134a",
    timestamp: new Date().toISOString(),
  })
}
