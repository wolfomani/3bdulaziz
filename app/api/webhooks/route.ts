import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = headers()

    // Get webhook signature for verification
    const signature = headersList.get("x-webhook-signature")
    const timestamp = headersList.get("x-webhook-timestamp")
    const userAgent = headersList.get("user-agent")

    // Parse the webhook payload
    let payload
    try {
      payload = JSON.parse(body)
    } catch (error) {
      payload = { raw: body }
    }

    // Log webhook data
    const webhookData = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      signature,
      userAgent,
      payload,
      headers: Object.fromEntries(headersList.entries()),
      body: body.substring(0, 1000), // Limit body size for logging
    }

    // Forward to webhook.site for testing
    try {
      await fetch("https://webhook.site/4f2e177c-931c-49c2-a095-ad4ee2684614", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-From": "drx3-api",
        },
        body: JSON.stringify(webhookData),
      })
    } catch (forwardError) {
      console.error("Failed to forward webhook:", forwardError)
    }

    // Process webhook based on type
    if (payload.type) {
      switch (payload.type) {
        case "user.created":
          await handleUserCreated(payload)
          break
        case "payment.completed":
          await handlePaymentCompleted(payload)
          break
        case "ai.request":
          await handleAIRequest(payload)
          break
        default:
          console.log("Unknown webhook type:", payload.type)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
      id: webhookData.id,
    })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    endpoint: "/api/webhooks",
    supportedMethods: ["POST"],
    timestamp: new Date().toISOString(),
  })
}

async function handleUserCreated(payload: any) {
  console.log("Processing user creation:", payload)
  // Add user creation logic here
}

async function handlePaymentCompleted(payload: any) {
  console.log("Processing payment completion:", payload)
  // Add payment processing logic here
}

async function handleAIRequest(payload: any) {
  console.log("Processing AI request:", payload)
  // Add AI request processing logic here
}
