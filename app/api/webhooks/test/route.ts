import { type NextRequest, NextResponse } from "next/server"
import { WebhookHandler, globalWebhookLogger, webhookConfigs } from "@/lib/webhook-handler"
import { v4 as uuidv4 } from "uuid"

// Force dynamic rendering to avoid build errors
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ success: false, message: "رابط مطلوب" }, { status: 400 })
    }

    const testPayload = {
      event: "test",
      timestamp: new Date().toISOString(),
      source: "drx3-api",
      data: {
        message: "This is a test webhook from DRX3 API",
        user: "system",
        test_id: Math.random().toString(36).substring(7),
      },
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "DRX3-Webhook-Tester/1.0",
        "X-Webhook-Source": "drx3-api",
      },
      body: JSON.stringify(testPayload),
    })

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: "تم إرسال webhook بنجاح",
        status: response.status,
        response: await response.text(),
      })
    } else {
      return NextResponse.json({
        success: false,
        message: `فشل في إرسال webhook: ${response.status} ${response.statusText}`,
      })
    }
  } catch (error) {
    console.error("Test webhook error:", error)
    return NextResponse.json({ success: false, message: "خطأ في إرسال webhook" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scenario = searchParams.get("scenario") || "ping"

    // Predefined test scenarios
    const scenarios = {
      ping: {
        message: "Ping test from Dr X webhook system",
        data: { status: "active", timestamp: new Date().toISOString() },
      },
      github_push: {
        message: "Simulated GitHub push event",
        data: {
          repository: "wolfomani/3bdulaziz",
          branch: "main",
          commits: 3,
          pusher: "wolfomani",
        },
      },
      vercel_deployment: {
        message: "Simulated Vercel deployment event",
        data: {
          deployment: {
            id: "dpl_test_123",
            url: "3bdulaziz-test.vercel.app",
            state: "READY",
          },
          project: { name: "3bdulaziz" },
        },
      },
      error_test: {
        message: "Test error handling",
        data: { error: "Simulated error for testing", code: 500 },
      },
    }

    const testData = scenarios[scenario as keyof typeof scenarios] || scenarios.ping

    // Create and log test event
    const webhookEvent = {
      id: uuidv4(),
      type: `test.${scenario}`,
      timestamp: new Date().toISOString(),
      source: "test",
      data: testData,
      metadata: {
        userAgent: request.headers.get("user-agent") || "unknown",
        test: true,
        scenario,
      },
    }

    globalWebhookLogger.log(webhookEvent)

    // Send to webhook.site
    try {
      const webhookHandler = new WebhookHandler(webhookConfigs.webhookSite)
      await webhookHandler.send({
        source: "drx3-test-get",
        scenario,
        event_id: webhookEvent.id,
        ...testData,
      })
    } catch (forwardError) {
      console.warn("Failed to forward GET test webhook:", forwardError)
    }

    return NextResponse.json({
      success: true,
      message: `Test scenario '${scenario}' executed`,
      event: webhookEvent,
      available_scenarios: Object.keys(scenarios),
      usage: "GET /api/webhooks/test?scenario=ping",
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

function generateTestData(scenario: string) {
  const baseData = {
    timestamp: new Date().toISOString(),
    test_id: uuidv4(),
    environment: "test",
  }

  switch (scenario) {
    case "github_push":
      return {
        ...baseData,
        repository: "wolfomani/3bdulaziz",
        branch: "main",
        commits: [
          {
            id: "abc123",
            message: "Test commit 1",
            author: "wolfomani",
          },
          {
            id: "def456",
            message: "Test commit 2",
            author: "wolfomani",
          },
        ],
      }

    case "vercel_deployment":
      return {
        ...baseData,
        deployment: {
          id: `dpl_${Date.now()}`,
          url: `3bdulaziz-${Date.now()}.vercel.app`,
          state: "READY",
          created_at: new Date().toISOString(),
        },
        project: {
          name: "3bdulaziz",
          id: "prj_test_123",
        },
      }

    case "error_simulation":
      return {
        ...baseData,
        error: {
          message: "Simulated webhook processing error",
          code: "WEBHOOK_TEST_ERROR",
          stack: "Error: Test error\n    at testFunction (test.js:1:1)",
        },
      }

    case "performance_test":
      return {
        ...baseData,
        metrics: {
          processing_time: Math.random() * 1000,
          memory_usage: Math.random() * 100,
          cpu_usage: Math.random() * 50,
        },
        load_test: true,
      }

    default:
      return {
        ...baseData,
        scenario,
        message: "Basic test webhook data",
      }
  }
}
