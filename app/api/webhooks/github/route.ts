import { type NextRequest, NextResponse } from "next/server"
import { createHmac } from "crypto"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

function verifyGitHubSignature(payload: string, signature: string, secret: string): boolean {
  const hmac = createHmac("sha256", secret)
  hmac.update(payload)
  const expectedSignature = `sha256=${hmac.digest("hex")}`
  return signature === expectedSignature
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-hub-signature-256")
    const event = request.headers.get("x-github-event")
    const deliveryId = request.headers.get("x-github-delivery")

    if (!signature || !event || !deliveryId) {
      return NextResponse.json({ error: "Missing required GitHub webhook headers" }, { status: 400 })
    }

    // Verify webhook signature
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error("GITHUB_WEBHOOK_SECRET not configured")
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
    }

    if (!verifyGitHubSignature(body, signature, webhookSecret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    // Parse the payload
    const payload = JSON.parse(body)

    // Log the webhook event
    try {
      await sql`
        INSERT INTO webhook_events (
          event_type, 
          delivery_id, 
          payload, 
          processed, 
          created_at
        )
        VALUES (
          ${event}, 
          ${deliveryId}, 
          ${JSON.stringify(payload)}, 
          true, 
          NOW()
        )
      `
    } catch (dbError) {
      console.error("Failed to log webhook event:", dbError)
      // Continue processing even if logging fails
    }

    // Process different event types
    switch (event) {
      case "push":
        await handlePushEvent(payload)
        break
      case "pull_request":
        await handlePullRequestEvent(payload)
        break
      case "issues":
        await handleIssuesEvent(payload)
        break
      case "star":
        await handleStarEvent(payload)
        break
      case "fork":
        await handleForkEvent(payload)
        break
      default:
        console.log(`Received unhandled GitHub event: ${event}`)
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${event} event`,
      deliveryId,
    })
  } catch (error) {
    console.error("Error processing GitHub webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function handlePushEvent(payload: any) {
  console.log(`Push event: ${payload.commits?.length || 0} commits to ${payload.ref}`)

  // Example: Trigger deployment or CI/CD pipeline
  if (payload.ref === "refs/heads/main") {
    console.log("Push to main branch detected - triggering deployment")
    // Add deployment logic here
  }
}

async function handlePullRequestEvent(payload: any) {
  const action = payload.action
  const prNumber = payload.number
  const title = payload.pull_request?.title

  console.log(`Pull request ${action}: #${prNumber} - ${title}`)

  // Example: Auto-assign reviewers, run tests, etc.
  if (action === "opened") {
    console.log("New PR opened - running automated checks")
    // Add PR automation logic here
  }
}

async function handleIssuesEvent(payload: any) {
  const action = payload.action
  const issueNumber = payload.issue?.number
  const title = payload.issue?.title

  console.log(`Issue ${action}: #${issueNumber} - ${title}`)

  // Example: Auto-label issues, assign to team members, etc.
  if (action === "opened") {
    console.log("New issue opened - applying auto-labels")
    // Add issue automation logic here
  }
}

async function handleStarEvent(payload: any) {
  const action = payload.action
  const stargazer = payload.sender?.login
  const repoName = payload.repository?.full_name

  console.log(`Repository ${action === "created" ? "starred" : "unstarred"} by ${stargazer}: ${repoName}`)

  // Example: Send thank you message, track analytics, etc.
  if (action === "created") {
    console.log("New star received - updating analytics")
    // Add star tracking logic here
  }
}

async function handleForkEvent(payload: any) {
  const forker = payload.sender?.login
  const originalRepo = payload.repository?.full_name
  const forkRepo = payload.forkee?.full_name

  console.log(`Repository forked by ${forker}: ${originalRepo} -> ${forkRepo}`)

  // Example: Track fork analytics, send welcome message, etc.
  console.log("New fork created - updating fork analytics")
  // Add fork tracking logic here
}

export async function GET() {
  return NextResponse.json({
    message: "GitHub webhook endpoint is active",
    timestamp: new Date().toISOString(),
  })
}
