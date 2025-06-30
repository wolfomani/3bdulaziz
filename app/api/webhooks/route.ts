import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { WebhookHandler, webhookConfigs, globalWebhookLogger, type WebhookEvent } from "@/lib/webhook-handler"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = headers()

    // Get webhook signature for verification
    const signature = headersList.get("x-webhook-signature")
    const timestamp = headersList.get("x-webhook-timestamp")
    const userAgent = headersList.get("user-agent")
    const contentType = headersList.get("content-type")

    // Parse the webhook payload
    let payload
    try {
      payload = JSON.parse(body)
    } catch (error) {
      payload = { raw: body, contentType }
    }

    // Create webhook event
    const webhookEvent: WebhookEvent = {
      id: crypto.randomUUID(),
      type: payload.type || "unknown",
      timestamp: new Date().toISOString(),
      source: "external",
      data: payload,
      metadata: {
        userAgent: userAgent || undefined,
        headers: Object.fromEntries(headersList.entries()),
      },
    }

    // Log the event
    globalWebhookLogger.log(webhookEvent)

    // Forward to webhook.site for testing and monitoring
    try {
      const webhookHandler = new WebhookHandler(webhookConfigs.webhookSite)
      await webhookHandler.send({
        ...webhookEvent,
        forwardedFrom: "drx3-api",
        originalBody: body.substring(0, 1000), // Limit body size
      })
    } catch (forwardError) {
      console.error("Failed to forward webhook to webhook.site:", forwardError)
    }

    // Process webhook based on type
    if (payload.type) {
      switch (payload.type) {
        case "user.created":
          await handleUserCreated(payload)
          break
        case "user.updated":
          await handleUserUpdated(payload)
          break
        case "payment.completed":
          await handlePaymentCompleted(payload)
          break
        case "payment.failed":
          await handlePaymentFailed(payload)
          break
        case "ai.request":
          await handleAIRequest(payload)
          break
        case "ai.response":
          await handleAIResponse(payload)
          break
        case "system.health":
          await handleSystemHealth(payload)
          break
        case "deployment.started":
          await handleDeploymentStarted(payload)
          break
        case "deployment.completed":
          await handleDeploymentCompleted(payload)
          break
        default:
          console.log("Unknown webhook type:", payload.type)
          await handleUnknownWebhook(payload)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
      id: webhookEvent.id,
      type: webhookEvent.type,
      timestamp: webhookEvent.timestamp,
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
  const recentEvents = globalWebhookLogger.getEvents(10)

  return NextResponse.json({
    status: "active",
    endpoint: "/api/webhooks",
    supportedMethods: ["POST", "GET"],
    supportedTypes: [
      "user.created",
      "user.updated",
      "payment.completed",
      "payment.failed",
      "ai.request",
      "ai.response",
      "system.health",
      "deployment.started",
      "deployment.completed",
    ],
    recentEvents: recentEvents.length,
    timestamp: new Date().toISOString(),
    configuration: {
      forwardingEnabled: true,
      webhookSiteUrl: webhookConfigs.webhookSite.url,
      retryAttempts: webhookConfigs.webhookSite.retryAttempts,
    },
  })
}

// Webhook handlers for different event types
async function handleUserCreated(payload: any) {
  console.log("Processing user creation:", {
    userId: payload.data?.id,
    email: payload.data?.email,
    timestamp: payload.timestamp,
  })

  // Add user creation logic here
  // Example: Send welcome email, create user profile, etc.
}

async function handleUserUpdated(payload: any) {
  console.log("Processing user update:", {
    userId: payload.data?.id,
    changes: payload.data?.changes,
    timestamp: payload.timestamp,
  })

  // Add user update logic here
}

async function handlePaymentCompleted(payload: any) {
  console.log("Processing payment completion:", {
    paymentId: payload.data?.id,
    amount: payload.data?.amount,
    currency: payload.data?.currency,
    userId: payload.data?.userId,
  })

  // Add payment processing logic here
  // Example: Update subscription, send receipt, unlock features
}

async function handlePaymentFailed(payload: any) {
  console.log("Processing payment failure:", {
    paymentId: payload.data?.id,
    reason: payload.data?.reason,
    userId: payload.data?.userId,
  })

  // Add payment failure logic here
  // Example: Send notification, retry payment, suspend service
}

async function handleAIRequest(payload: any) {
  console.log("Processing AI request:", {
    requestId: payload.data?.id,
    model: payload.data?.model,
    userId: payload.data?.userId,
    prompt: payload.data?.prompt?.substring(0, 100) + "...",
  })

  // Add AI request processing logic here
  // Example: Queue request, validate input, track usage
}

async function handleAIResponse(payload: any) {
  console.log("Processing AI response:", {
    requestId: payload.data?.requestId,
    model: payload.data?.model,
    tokensUsed: payload.data?.tokensUsed,
    responseTime: payload.data?.responseTime,
  })

  // Add AI response processing logic here
  // Example: Store response, update usage metrics, bill user
}

async function handleSystemHealth(payload: any) {
  console.log("Processing system health check:", {
    service: payload.data?.service,
    status: payload.data?.status,
    metrics: payload.data?.metrics,
  })

  // Add system health logic here
  // Example: Update monitoring dashboard, send alerts if unhealthy
}

async function handleDeploymentStarted(payload: any) {
  console.log("Processing deployment start:", {
    deploymentId: payload.data?.id,
    environment: payload.data?.environment,
    version: payload.data?.version,
  })

  // Add deployment start logic here
  // Example: Update status page, notify team
}

async function handleDeploymentCompleted(payload: any) {
  console.log("Processing deployment completion:", {
    deploymentId: payload.data?.id,
    environment: payload.data?.environment,
    status: payload.data?.status,
    duration: payload.data?.duration,
  })

  // Add deployment completion logic here
  // Example: Update status page, run post-deployment tests
}

async function handleUnknownWebhook(payload: any) {
  console.log("Processing unknown webhook:", {
    type: payload.type,
    hasData: !!payload.data,
    timestamp: payload.timestamp,
  })

  // Add unknown webhook logic here
  // Example: Log for analysis, forward to admin
}
