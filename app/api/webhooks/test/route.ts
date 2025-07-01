import { type NextRequest, NextResponse } from "next/server"
import { globalWebhookLogger, WebhookHandler, webhookConfigs } from "@/lib/webhook-handler"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, type = "test.webhook", data = {} } = body

    // Create test webhook event
    const testEvent = {
      id: uuidv4(),
      type,
      timestamp: new Date().toISOString(),
      source: "test",
      data: {
        message: message || "Test webhook from API",
        test_data: data,
        user_agent: request.headers.get("user-agent"),
        ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        timestamp: new Date().toISOString(),
      },
      metadata: {
        userAgent: request.headers.get("user-agent"),
        contentType: request.headers.get("content-type"),
        origin: request.headers.get("origin"),
      },
    }

    // Log the test event
    globalWebhookLogger.log(testEvent)

    console.log(`🧪 Test webhook triggered: ${testEvent.id}`)

    // Forward to webhook.site for monitoring
    try {
      const webhookHandler = new WebhookHandler(webhookConfigs.webhookSite)
      await webhookHandler.send({
        test_event: true,
        event_id: testEvent.id,
        message: testEvent.data.message,
        timestamp: testEvent.timestamp,
        source: "drx3-test-endpoint",
        original_request: {
          headers: Object.fromEntries(request.headers.entries()),
          body: body,
        },
      })

      console.log("✅ Test webhook forwarded to webhook.site")
    } catch (forwardError) {
      console.warn("⚠️ Failed to forward test webhook:", forwardError)
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
        error: "Failed to process test webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  // Send a predefined test webhook
  const testScenarios = [
    {
      type: "test.user_created",
      data: {
        user_id: "test_user_123",
        email: "test@example.com",
        name: "Test User",
        created_at: new Date().toISOString(),
      },
    },
    {
      type: "test.payment_completed",
      data: {
        payment_id: "pay_test_456",
        amount: 99.99,
        currency: "USD",
        user_id: "test_user_123",
        status: "completed",
      },
    },
    {
      type: "test.ai_request",
      data: {
        request_id: "ai_req_789",
        model: "gpt-4",
        prompt: "مرحبا، كيف حالك؟",
        user_id: "test_user_123",
        tokens_used: 150,
      },
    },
  ]

  const results = []

  for (const scenario of testScenarios) {
    try {
      const testEvent = {
        id: uuidv4(),
        type: scenario.type,
        timestamp: new Date().toISOString(),
        source: "test_scenario",
        data: scenario.data,
        metadata: {
          scenario: true,
          generated_by: "GET /api/webhooks/test",
        },
      }

      // Log the scenario event
      globalWebhookLogger.log(testEvent)

      // Forward to webhook.site
      const webhookHandler = new WebhookHandler(webhookConfigs.webhookSite)
      await webhookHandler.send({
        test_scenario: true,
        scenario_type: scenario.type,
        event_id: testEvent.id,
        data: scenario.data,
        timestamp: testEvent.timestamp,
      })

      results.push({
        scenario: scenario.type,
        success: true,
        event_id: testEvent.id,
      })

      console.log(`🎭 Test scenario executed: ${scenario.type}`)
    } catch (error) {
      results.push({
        scenario: scenario.type,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  return NextResponse.json({
    success: true,
    message: "Test scenarios executed",
    scenarios: results,
    webhook_site: webhookConfigs.webhookSite.url,
    instructions: {
      post: "Send POST request with { message: 'your test message', type: 'custom.type' }",
      get: "GET request runs predefined test scenarios",
    },
  })
}
