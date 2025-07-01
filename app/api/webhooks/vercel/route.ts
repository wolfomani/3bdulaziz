import { type NextRequest, NextResponse } from "next/server"
import { globalWebhookLogger, WebhookHandler, webhookConfigs } from "@/lib/webhook-handler"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const headers = Object.fromEntries(request.headers.entries())

    // Verify Vercel signature if configured
    const signature = headers["x-vercel-signature"]
    if (signature && process.env.VERCEL_WEBHOOK_SECRET) {
      // Implement Vercel signature verification here if needed
      console.log("Vercel signature verification not implemented yet")
    }

    // Create webhook event
    const webhookEvent = {
      id: uuidv4(),
      type: `vercel.${body.type || "deployment"}`,
      timestamp: new Date().toISOString(),
      source: "vercel",
      data: body,
      metadata: {
        userAgent: headers["user-agent"],
        signature: signature || "none",
        deployment: body.deployment,
        project: body.project,
      },
    }

    // Log the event
    globalWebhookLogger.log(webhookEvent)

    console.log(`▲ Vercel webhook received: ${body.type || "deployment"}`)

    let processingResult: any = {}

    // Process different Vercel events
    switch (body.type) {
      case "deployment.created":
        processingResult = await handleDeploymentCreated(body)
        break
      case "deployment.succeeded":
        processingResult = await handleDeploymentSucceeded(body)
        break
      case "deployment.failed":
        processingResult = await handleDeploymentFailed(body)
        break
      case "deployment.canceled":
        processingResult = await handleDeploymentCanceled(body)
        break
      default:
        processingResult = await handleGenericVercelEvent(body)
    }

    // Forward to webhook.site for monitoring
    try {
      const webhookHandler = new WebhookHandler(webhookConfigs.webhookSite)
      await webhookHandler.send({
        source: "vercel",
        event_type: body.type || "deployment",
        deployment: {
          url: body.deployment?.url,
          state: body.deployment?.state,
          project: body.project?.name,
        },
        processing_result: processingResult,
        timestamp: webhookEvent.timestamp,
      })
    } catch (forwardError) {
      console.warn("Failed to forward Vercel webhook to webhook.site:", forwardError)
    }

    return NextResponse.json({
      success: true,
      message: "Vercel webhook processed successfully",
      event: {
        id: webhookEvent.id,
        type: webhookEvent.type,
        timestamp: webhookEvent.timestamp,
      },
      processing: processingResult,
    })
  } catch (error) {
    console.error("Vercel webhook error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process Vercel webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function handleDeploymentCreated(payload: any) {
  const deployment = payload.deployment
  const project = payload.project

  console.log(`🚀 Deployment created: ${deployment?.url} (${project?.name})`)

  return {
    success: true,
    message: "Deployment created",
    deployment: {
      id: deployment?.id,
      url: deployment?.url,
      state: deployment?.state,
      project: project?.name,
      created_at: deployment?.createdAt,
    },
  }
}

async function handleDeploymentSucceeded(payload: any) {
  const deployment = payload.deployment
  const project = payload.project

  console.log(`✅ Deployment succeeded: ${deployment?.url} (${project?.name})`)

  // You can add post-deployment actions here
  // For example: send notifications, update status pages, run tests, etc.

  return {
    success: true,
    message: "Deployment succeeded",
    deployment: {
      id: deployment?.id,
      url: deployment?.url,
      state: deployment?.state,
      project: project?.name,
      ready_at: deployment?.readyAt,
      build_duration:
        deployment?.buildingAt && deployment?.readyAt
          ? new Date(deployment.readyAt).getTime() - new Date(deployment.buildingAt).getTime()
          : null,
    },
    actions: {
      notification_sent: false, // Implement notification logic
      status_updated: false, // Implement status page update
      tests_triggered: false, // Implement test automation
    },
  }
}

async function handleDeploymentFailed(payload: any) {
  const deployment = payload.deployment
  const project = payload.project

  console.log(`❌ Deployment failed: ${deployment?.url} (${project?.name})`)

  // You can add failure handling here
  // For example: send alerts, create issues, rollback, etc.

  return {
    success: true,
    message: "Deployment failed",
    deployment: {
      id: deployment?.id,
      url: deployment?.url,
      state: deployment?.state,
      project: project?.name,
      failed_at: deployment?.readyAt,
      error: deployment?.error,
    },
    actions: {
      alert_sent: false, // Implement alerting logic
      issue_created: false, // Implement issue creation
      rollback_triggered: false, // Implement rollback logic
    },
  }
}

async function handleDeploymentCanceled(payload: any) {
  const deployment = payload.deployment
  const project = payload.project

  console.log(`⏹️ Deployment canceled: ${deployment?.url} (${project?.name})`)

  return {
    success: true,
    message: "Deployment canceled",
    deployment: {
      id: deployment?.id,
      url: deployment?.url,
      state: deployment?.state,
      project: project?.name,
      canceled_at: deployment?.canceledAt,
    },
  }
}

async function handleGenericVercelEvent(payload: any) {
  console.log(`▲ Vercel event: ${payload.type || "unknown"}`)

  return {
    success: true,
    message: `Vercel ${payload.type || "unknown"} event processed`,
    payload_keys: Object.keys(payload),
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Vercel webhook endpoint is active",
    endpoint: "/api/webhooks/vercel",
    supported_events: ["deployment.created", "deployment.succeeded", "deployment.failed", "deployment.canceled"],
    setup_instructions: {
      "1": "Go to your Vercel project settings",
      "2": "Navigate to the Git section",
      "3": "Add a new webhook with URL: https://3bdulaziz.vercel.app/api/webhooks/vercel",
      "4": "Select the events you want to receive",
    },
    monitoring: "https://webhook.site/4f2e177c-931c-49c2-a095-ad4ee2684614",
  })
}
