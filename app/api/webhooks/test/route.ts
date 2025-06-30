import { type NextRequest, NextResponse } from "next/server"
import { WebhookHandler, webhookConfigs, globalWebhookLogger, type WebhookEvent } from "@/lib/webhook-handler"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    let payload

    // Parse request body
    try {
      payload = JSON.parse(body)
    } catch (error) {
      payload = { message: body || "Test webhook triggered", timestamp: new Date().toISOString() }
    }

    // Create test webhook event
    const testEvent: WebhookEvent = {
      id: crypto.randomUUID(),
      type: payload.type || "test.webhook",
      timestamp: new Date().toISOString(),
      source: "test",
      data: {
        message: payload.message || "Test webhook from Dr X API",
        testData: payload.testData || {
          userId: "test-user-123",
          action: "webhook_test",
          environment: process.env.NODE_ENV || "development",
        },
        customPayload: payload,
      },
      metadata: {
        userAgent: request.headers.get("user-agent") || undefined,
        origin: request.headers.get("origin") || undefined,
        testMode: true,
      },
    }

    // Log the test event
    globalWebhookLogger.log(testEvent)

    console.log("Test webhook triggered:", {
      id: testEvent.id,
      type: testEvent.type,
      message: testEvent.data.message,
    })

    // Forward to webhook.site for testing
    try {
      const webhookHandler = new WebhookHandler(webhookConfigs.webhookSite)
      await webhookHandler.send({
        ...testEvent,
        forwardedFrom: "drx3-test-webhook",
        testInfo: {
          endpoint: "/api/webhooks/test",
          triggeredAt: new Date().toISOString(),
          environment: process.env.NODE_ENV,
        },
      })
      console.log("Test webhook forwarded to webhook.site successfully")
    } catch (forwardError) {
      console.error("Failed to forward test webhook:", forwardError)
    }

    // Simulate different webhook scenarios based on payload
    if (payload.scenario) {
      await simulateWebhookScenario(payload.scenario, testEvent)
    }

    return NextResponse.json({
      success: true,
      message: "Test webhook processed successfully",
      event: {
        id: testEvent.id,
        type: testEvent.type,
        timestamp: testEvent.timestamp,
      },
      forwarded: true,
      webhookSiteUrl: webhookConfigs.webhookSite.url,
    })
  } catch (error) {
    console.error("Test webhook error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Test webhook failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  // Get recent test events
  const recentTestEvents = globalWebhookLogger
    .getEvents()
    .filter((event) => event.source === "test")
    .slice(0, 5)

  return NextResponse.json({
    status: "active",
    endpoint: "/api/webhooks/test",
    description: "Test webhook endpoint for Dr X API",
    usage: {
      post: "Send test webhook with custom payload",
      get: "Get test webhook status and recent events",
    },
    examples: {
      basicTest: {
        method: "POST",
        body: { message: "Hello from test webhook" },
      },
      scenarioTest: {
        method: "POST",
        body: {
          scenario: "user_signup",
          testData: { userId: "123", email: "test@example.com" },
        },
      },
    },
    recentEvents: recentTestEvents.length,
    lastTest: recentTestEvents[0]?.timestamp || null,
    configuration: {
      forwardingEnabled: true,
      webhookSiteUrl: webhookConfigs.webhookSite.url,
      logRetention: "24 hours",
    },
    timestamp: new Date().toISOString(),
  })
}

// Simulate different webhook scenarios for testing
async function simulateWebhookScenario(scenario: string, baseEvent: WebhookEvent) {
  console.log(`Simulating webhook scenario: ${scenario}`)

  switch (scenario) {
    case "user_signup":
      await simulateUserSignup(baseEvent)
      break
    case "payment_success":
      await simulatePaymentSuccess(baseEvent)
      break
    case "ai_request":
      await simulateAIRequest(baseEvent)
      break
    case "deployment":
      await simulateDeployment(baseEvent)
      break
    case "error_scenario":
      await simulateErrorScenario(baseEvent)
      break
    default:
      console.log(`Unknown scenario: ${scenario}`)
  }
}

async function simulateUserSignup(baseEvent: WebhookEvent) {
  const userEvent: WebhookEvent = {
    ...baseEvent,
    id: crypto.randomUUID(),
    type: "user.created",
    data: {
      ...baseEvent.data,
      user: {
        id: "user_" + Math.random().toString(36).substr(2, 9),
        email: "test@example.com",
        name: "Test User",
        createdAt: new Date().toISOString(),
      },
    },
  }

  globalWebhookLogger.log(userEvent)
  console.log("Simulated user signup:", userEvent.data.user)
}

async function simulatePaymentSuccess(baseEvent: WebhookEvent) {
  const paymentEvent: WebhookEvent = {
    ...baseEvent,
    id: crypto.randomUUID(),
    type: "payment.completed",
    data: {
      ...baseEvent.data,
      payment: {
        id: "pay_" + Math.random().toString(36).substr(2, 9),
        amount: 2999,
        currency: "USD",
        status: "completed",
        userId: "user_123",
      },
    },
  }

  globalWebhookLogger.log(paymentEvent)
  console.log("Simulated payment success:", paymentEvent.data.payment)
}

async function simulateAIRequest(baseEvent: WebhookEvent) {
  const aiEvent: WebhookEvent = {
    ...baseEvent,
    id: crypto.randomUUID(),
    type: "ai.request",
    data: {
      ...baseEvent.data,
      request: {
        id: "req_" + Math.random().toString(36).substr(2, 9),
        model: "gpt-4",
        prompt: "Test AI request from webhook",
        userId: "user_123",
        tokensUsed: 150,
      },
    },
  }

  globalWebhookLogger.log(aiEvent)
  console.log("Simulated AI request:", aiEvent.data.request)
}

async function simulateDeployment(baseEvent: WebhookEvent) {
  const deployEvent: WebhookEvent = {
    ...baseEvent,
    id: crypto.randomUUID(),
    type: "deployment.completed",
    data: {
      ...baseEvent.data,
      deployment: {
        id: "dep_" + Math.random().toString(36).substr(2, 9),
        url: "https://test-deployment.vercel.app",
        status: "success",
        duration: 45000,
        project: "drx3-api",
      },
    },
  }

  globalWebhookLogger.log(deployEvent)
  console.log("Simulated deployment:", deployEvent.data.deployment)
}

async function simulateErrorScenario(baseEvent: WebhookEvent) {
  const errorEvent: WebhookEvent = {
    ...baseEvent,
    id: crypto.randomUUID(),
    type: "system.error",
    data: {
      ...baseEvent.data,
      error: {
        code: "TEST_ERROR",
        message: "Simulated error for testing",
        timestamp: new Date().toISOString(),
        severity: "medium",
      },
    },
  }

  globalWebhookLogger.log(errorEvent)
  console.log("Simulated error scenario:", errorEvent.data.error)
}
