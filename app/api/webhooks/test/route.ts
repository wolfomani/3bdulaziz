import { type NextRequest, NextResponse } from "next/server"
import { WebhookHandler, webhookConfigs } from "@/lib/webhook-handler"

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json()

    const testPayload = {
      id: crypto.randomUUID(),
      type: type || "test.event",
      timestamp: new Date().toISOString(),
      source: "drx3-api-test",
      data: data || {
        message: "This is a test webhook from drx3 API",
        user: "test-user",
        action: "webhook-test",
      },
    }

    // Send to webhook.site
    const webhookHandler = new WebhookHandler(webhookConfigs.webhookSite)
    const success = await webhookHandler.send(testPayload, {
      "X-Test-Webhook": "true",
      "X-Source": "drx3-api",
    })

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Test webhook sent successfully",
        payload: testPayload,
        webhookUrl: webhookConfigs.webhookSite.url,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to send test webhook",
          payload: testPayload,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Test webhook error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process test webhook",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/webhooks/test",
    description: "Test webhook endpoint for drx3 API",
    methods: ["POST"],
    targetUrl: webhookConfigs.webhookSite.url,
    usage: {
      method: "POST",
      body: {
        type: "string (optional)",
        data: "object (optional)",
      },
    },
  })
}
