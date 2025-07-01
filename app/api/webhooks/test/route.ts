import { type NextRequest, NextResponse } from "next/server"
import { WebhookHandler, globalWebhookLogger } from "@/lib/webhook-handler"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scenario = "basic", message = "Test webhook", data = {} } = body

    // Create test webhook event
    const testEvent = {
      id: uuidv4(),
      type: `test.${scenario}`,
      timestamp: new Date().toISOString(),
      source: "test",
      data: {
        message,
        scenario,
        ...data,
        test_metadata: {
          user_agent: request.headers.get("user-agent"),
          timestamp: new Date().toISOString(),
          random_id: Math.random().toString(36).substring(7),
        },
      },
      metadata: {
        test: true,
        scenario,
        ip: request.headers.get("x-forwarded-for") || "unknown",
      },
    }

    // Log the test event
    globalWebhookLogger.log(testEvent)

    // Send to webhook.site for monitoring
    const webhookHandler = new WebhookHandler({
      url: "https://webhook.site/4f2e177c-931c-49c2-a095-ad4ee2684614",
      retryAttempts: 2,
      timeout: 5000,
    })

    const success = await webhookHandler.send({
      test_type: scenario,
      message,
      event_id: testEvent.id,
      timestamp: testEvent.timestamp,
      payload: testEvent.data,
    })

    return NextResponse.json({
      success: true,
      message: "Test webhook sent successfully",
      event: testEvent,
      forwarded: success,
      webhook_site: "https://webhook.site/4f2e177c-931c-49c2-a095-ad4ee2684614",
    })
  } catch (error) {
    console.error("Test webhook error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send test webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scenario = searchParams.get("scenario") || "ping"

    // Predefined test scenarios
    const scenarios = {
      ping: {
        message: "Ping test from Dr X API",
        data: { zen: "Practicality beats purity." },
      },
      github_push: {
        message: "Simulated GitHub push event",
        data: {
          ref: "refs/heads/main",
          commits: [
            {
              id: "abc123",
              message: "Test commit",
              author: { name: "Dr X", email: "drx@example.com" },
            },
          ],
          repository: { name: "drx3apipage2", full_name: "wolfomani/3bdulaziz" },
        },
      },
      vercel_deployment: {
        message: "Simulated Vercel deployment event",
        data: {
          deployment: {
            id: "dpl_test123",
            url: "drx3-test.vercel.app",
            state: "READY",
          },
          project: { name: "drx3apipage2" },
        },
      },
      error_test: {
        message: "Error simulation test",
        data: { error: "Simulated error for testing" },
      },
    }

    const testData = scenarios[scenario as keyof typeof scenarios] || scenarios.ping

    // Create and send test webhook
    const testEvent = {
      id: uuidv4(),
      type: `test.${scenario}`,
      timestamp: new Date().toISOString(),
      source: "test",
      data: testData,
      metadata: {
        test: true,
        scenario,
        triggered_by: "GET_request",
      },
    }

    globalWebhookLogger.log(testEvent)

    // Send to webhook.site
    const webhookHandler = new WebhookHandler({
      url: "https://webhook.site/4f2e177c-931c-49c2-a095-ad4ee2684614",
      retryAttempts: 1,
      timeout: 3000,
    })

    const success = await webhookHandler.send({
      test_scenario: scenario,
      event_id: testEvent.id,
      timestamp: testEvent.timestamp,
      ...testData,
    })

    return NextResponse.json({
      success: true,
      message: `Test scenario '${scenario}' executed`,
      event: testEvent,
      forwarded: success,
      available_scenarios: Object.keys(scenarios),
    })
  } catch (error) {
    console.error("GET test webhook error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to execute test scenario",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
