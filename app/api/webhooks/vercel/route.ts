import { type NextRequest, NextResponse } from "next/server"
import { WebhookHandler, globalWebhookLogger, WebhookUtils } from "@/lib/webhook-handler"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const headers = Object.fromEntries(request.headers.entries())

    // Verify Vercel signature if secret is provided
    if (process.env.VERCEL_WEBHOOK_SECRET) {
      const signature = headers["x-vercel-signature"]
      const rawBody = JSON.stringify(body)

      if (!signature || !WebhookUtils.validateSignature(rawBody, signature, process.env.VERCEL_WEBHOOK_SECRET)) {
        console.warn("Invalid Vercel webhook signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    // Extract Vercel event information
    const deployment = body.deployment || {}
    const project = body.project || {}
    const team = body.team || {}

    // Determine event type
    let eventType = "vercel.deployment"
    if (deployment.state) {
      eventType = `vercel.deployment.${deployment.state.toLowerCase()}`
    }

    // Create webhook event
    const webhookEvent = {
      id: uuidv4(),
      type: eventType,
      timestamp: new Date().toISOString(),
      source: "vercel",
      data: body,
      metadata: {
        deployment_id: deployment.id,
        deployment_url: deployment.url,
        project_name: project.name,
        team_name: team?.name,
        state: deployment.state,
        ...WebhookUtils.extractMetadata(request),
      },
    }

    // Log the event
    globalWebhookLogger.log(webhookEvent)

    // Process the Vercel webhook
    const processingResult = await processVercelWebhook(webhookEvent)

    // Forward to webhook.site for monitoring
    try {
      const webhookHandler = new WebhookHandler({
        url: "https://webhook.site/4f2e177c-931c-49c2-a095-ad4ee2684614",
        retryAttempts: 1,
        timeout: 5000,
      })

      await webhookHandler.send({
        source: "vercel",
        event_type: eventType,
        deployment: {
          id: deployment.id,
          url: deployment.url,
          state: deployment.state,
          created_at: deployment.createdAt,
        },
        project: {
          name: project.name,
          id: project.id,
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
        type: eventType,
        deployment_url: deployment.url,
        state: deployment.state,
        timestamp: webhookEvent.timestamp,
      },
      processing: processingResult,
    })
  } catch (error) {
    console.error("Vercel webhook handler error:", error)
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

async function processVercelWebhook(event: any) {
  const { data } = event
  const deployment = data.deployment || {}
  const project = data.project || {}

  console.log(`▲ Vercel Deployment: ${deployment.state} - ${deployment.url}`)

  switch (deployment.state) {
    case "BUILDING":
      console.log(`🔨 Building deployment for ${project.name}`)
      return {
        success: true,
        message: "Deployment build started",
        action: "build_started",
        deployment_id: deployment.id,
      }

    case "READY":
      console.log(`✅ Deployment ready: ${deployment.url}`)

      // Perform post-deployment actions
      await performPostDeploymentActions(deployment, project)

      return {
        success: true,
        message: "Deployment completed successfully",
        action: "deployment_ready",
        deployment_url: deployment.url,
        deployment_id: deployment.id,
      }

    case "ERROR":
      console.error(`❌ Deployment failed for ${project.name}`)

      // Handle deployment failure
      await handleDeploymentFailure(deployment, project)

      return {
        success: false,
        message: "Deployment failed",
        action: "deployment_failed",
        deployment_id: deployment.id,
        error: deployment.error || "Unknown deployment error",
      }

    case "CANCELED":
      console.log(`⏹️ Deployment canceled for ${project.name}`)
      return {
        success: true,
        message: "Deployment was canceled",
        action: "deployment_canceled",
        deployment_id: deployment.id,
      }

    default:
      console.log(`📦 Vercel deployment event: ${deployment.state}`)
      return {
        success: true,
        message: `Deployment state: ${deployment.state}`,
        action: "deployment_update",
        state: deployment.state,
        deployment_id: deployment.id,
      }
  }
}

async function performPostDeploymentActions(deployment: any, project: any) {
  try {
    console.log(`🚀 Performing post-deployment actions for ${deployment.url}`)

    // Example post-deployment actions:

    // 1. Health check
    try {
      const healthCheck = await fetch(`https://${deployment.url}/api/health`, {
        method: "GET",
        timeout: 10000,
      })

      if (healthCheck.ok) {
        console.log(`✅ Health check passed for ${deployment.url}`)
      } else {
        console.warn(`⚠️ Health check failed for ${deployment.url}: ${healthCheck.status}`)
      }
    } catch (healthError) {
      console.warn(`⚠️ Health check error for ${deployment.url}:`, healthError)
    }

    // 2. Cache warming (if needed)
    // await warmCache(deployment.url)

    // 3. Notify team/monitoring systems
    // await notifyDeploymentSuccess(deployment, project)

    // 4. Update database records
    // await updateDeploymentRecord(deployment)

    console.log(`✅ Post-deployment actions completed for ${deployment.url}`)
  } catch (error) {
    console.error("Post-deployment actions failed:", error)
  }
}

async function handleDeploymentFailure(deployment: any, project: any) {
  try {
    console.log(`🔍 Handling deployment failure for ${project.name}`)

    // Example failure handling actions:

    // 1. Log detailed error information
    console.error("Deployment failure details:", {
      deployment_id: deployment.id,
      project: project.name,
      error: deployment.error,
      created_at: deployment.createdAt,
    })

    // 2. Notify team of failure
    // await notifyDeploymentFailure(deployment, project)

    // 3. Trigger rollback if needed
    // await triggerRollback(project)

    // 4. Update monitoring/alerting systems
    // await updateMonitoringStatus(deployment, 'failed')

    console.log(`📝 Deployment failure handling completed for ${project.name}`)
  } catch (error) {
    console.error("Deployment failure handling error:", error)
  }
}

export async function GET() {
  try {
    return NextResponse.json({
      message: "Vercel webhook endpoint is operational",
      endpoint: "/api/webhooks/vercel",
      methods: ["POST"],
      description: "Handles Vercel deployment webhooks",
      supported_events: [
        "deployment.created",
        "deployment.building",
        "deployment.ready",
        "deployment.error",
        "deployment.canceled",
      ],
      setup_instructions: {
        step1: "Go to your Vercel project settings",
        step2: "Navigate to the 'Git' tab",
        step3: "Add webhook URL: https://3bdulaziz.vercel.app/api/webhooks/vercel",
        step4: "Configure events you want to receive",
        step5: "Add webhook secret (optional but recommended)",
      },
      monitoring: {
        webhook_site: "https://webhook.site/4f2e177c-931c-49c2-a095-ad4ee2684614",
        events_api: "/api/webhooks/events?source=vercel",
        stats_api: "/api/webhooks/stats",
      },
    })
  } catch (error) {
    console.error("Vercel webhook GET error:", error)
    return NextResponse.json({ error: "Failed to get webhook info" }, { status: 500 })
  }
}
