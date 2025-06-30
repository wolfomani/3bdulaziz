import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { WebhookHandler, webhookConfigs, globalWebhookLogger, type WebhookEvent } from "@/lib/webhook-handler"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = headers()

    // Get Vercel webhook headers
    const vercelSignature = headersList.get("x-vercel-signature")
    const userAgent = headersList.get("user-agent")
    const contentType = headersList.get("content-type")

    // Parse Vercel payload
    let payload
    try {
      payload = JSON.parse(body)
    } catch (error) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
    }

    // Create webhook event for logging
    const webhookEvent: WebhookEvent = {
      id: crypto.randomUUID(),
      type: `vercel.${payload.type || "deployment"}`,
      timestamp: new Date().toISOString(),
      source: "vercel",
      data: {
        type: payload.type,
        deployment: payload.deployment,
        project: payload.project,
        team: payload.team,
        user: payload.user,
        payload: payload,
      },
      metadata: {
        userAgent: userAgent || undefined,
        signature: vercelSignature || undefined,
        contentType: contentType || undefined,
      },
    }

    // Log the Vercel webhook event
    globalWebhookLogger.log(webhookEvent)

    console.log("Vercel webhook received:", {
      type: payload.type,
      deployment: payload.deployment?.url,
      project: payload.project?.name,
      state: payload.deployment?.state,
    })

    // Forward to webhook.site for monitoring
    try {
      const webhookHandler = new WebhookHandler(webhookConfigs.webhookSite)
      await webhookHandler.send({
        ...webhookEvent,
        forwardedFrom: "drx3-vercel-webhook",
        deploymentUrl: payload.deployment?.url,
        projectName: payload.project?.name,
      })
    } catch (forwardError) {
      console.error("Failed to forward Vercel webhook:", forwardError)
    }

    // Handle specific Vercel deployment events
    if (payload.type === "deployment") {
      await handleDeploymentEvent(payload)
    } else if (payload.type === "deployment.created") {
      await handleDeploymentCreated(payload)
    } else if (payload.type === "deployment.succeeded") {
      await handleDeploymentSucceeded(payload)
    } else if (payload.type === "deployment.failed") {
      await handleDeploymentFailed(payload)
    } else if (payload.type === "deployment.canceled") {
      await handleDeploymentCanceled(payload)
    } else {
      console.log(`Unhandled Vercel event: ${payload.type}`)
    }

    return NextResponse.json({
      success: true,
      message: "Vercel webhook processed successfully",
      type: payload.type,
      deployment: payload.deployment?.url,
      project: payload.project?.name,
      id: webhookEvent.id,
      timestamp: webhookEvent.timestamp,
    })
  } catch (error) {
    console.error("Vercel webhook processing error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Vercel webhook processing failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  const recentVercelEvents = globalWebhookLogger
    .getEvents()
    .filter((event) => event.source === "vercel")
    .slice(0, 10)

  return NextResponse.json({
    status: "active",
    endpoint: "/api/webhooks/vercel",
    description: "Vercel webhook handler for deployment events",
    supportedEvents: [
      "deployment",
      "deployment.created",
      "deployment.succeeded",
      "deployment.failed",
      "deployment.canceled",
    ],
    project: "3bdulaziz",
    recentEvents: recentVercelEvents.length,
    lastEvent: recentVercelEvents[0]?.timestamp || null,
    configuration: {
      forwardingEnabled: true,
      webhookSiteUrl: webhookConfigs.webhookSite.url,
    },
    timestamp: new Date().toISOString(),
  })
}

// Vercel event handlers
async function handleDeploymentEvent(payload: any) {
  const deploymentInfo = {
    url: payload.deployment?.url,
    state: payload.deployment?.state,
    project: payload.project?.name,
    creator: payload.deployment?.creator?.username,
    createdAt: payload.deployment?.createdAt,
  }

  console.log("Processing Vercel deployment event:", deploymentInfo)

  // Handle different deployment states
  switch (payload.deployment?.state) {
    case "BUILDING":
      console.log("Deployment is building...")
      break
    case "READY":
      console.log("Deployment is ready and live!")
      break
    case "ERROR":
      console.log("Deployment failed with error")
      break
    case "CANCELED":
      console.log("Deployment was canceled")
      break
  }
}

async function handleDeploymentCreated(payload: any) {
  console.log("Processing deployment created:", {
    url: payload.deployment?.url,
    project: payload.project?.name,
    creator: payload.deployment?.creator?.username,
  })

  // Log deployment start
  console.log("New deployment started for project:", payload.project?.name)
}

async function handleDeploymentSucceeded(payload: any) {
  console.log("Processing deployment succeeded:", {
    url: payload.deployment?.url,
    project: payload.project?.name,
    duration: payload.deployment?.buildingAt
      ? Date.now() - new Date(payload.deployment.buildingAt).getTime()
      : "unknown",
  })

  // Send success notification
  console.log("🎉 Deployment succeeded! Live at:", payload.deployment?.url)

  // Update status or send notifications here
  if (payload.project?.name === "3bdulaziz") {
    console.log("drx3 project deployed successfully to:", payload.deployment?.url)
  }
}

async function handleDeploymentFailed(payload: any) {
  console.log("Processing deployment failed:", {
    url: payload.deployment?.url,
    project: payload.project?.name,
    error: payload.deployment?.errorMessage,
  })

  // Send failure notification
  console.log("❌ Deployment failed for project:", payload.project?.name)

  if (payload.deployment?.errorMessage) {
    console.log("Error message:", payload.deployment.errorMessage)
  }

  // Send alert or notification here
}

async function handleDeploymentCanceled(payload: any) {
  console.log("Processing deployment canceled:", {
    url: payload.deployment?.url,
    project: payload.project?.name,
    canceledBy: payload.deployment?.canceledBy?.username,
  })

  console.log("⏹️ Deployment canceled for project:", payload.project?.name)
}
