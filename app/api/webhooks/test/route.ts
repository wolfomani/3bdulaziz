import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { payload } = await request.json()

    // Generate a test delivery ID
    const deliveryId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Parse the payload if it's a string
    let parsedPayload
    try {
      parsedPayload = typeof payload === "string" ? JSON.parse(payload) : payload
    } catch (parseError) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
    }

    // Add test metadata to the payload
    const testPayload = {
      ...parsedPayload,
      test: true,
      timestamp: new Date().toISOString(),
      delivery_id: deliveryId,
    }

    try {
      // Log the test webhook event
      await sql`
        INSERT INTO webhook_events (
          event_type, 
          delivery_id, 
          payload, 
          processed, 
          created_at
        )
        VALUES (
          'test', 
          ${deliveryId}, 
          ${JSON.stringify(testPayload)}, 
          true, 
          NOW()
        )
      `
    } catch (dbError) {
      console.error("Failed to log test webhook event:", dbError)
      // Continue even if logging fails
    }

    // Simulate webhook processing
    console.log("Processing test webhook:", testPayload)

    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 100))

    return NextResponse.json({
      success: true,
      message: "Test webhook processed successfully",
      deliveryId,
      payload: testPayload,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error processing test webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Webhook test endpoint is active",
    timestamp: new Date().toISOString(),
    endpoints: {
      github: "/api/webhooks/github",
      vercel: "/api/webhooks/vercel",
      test: "/api/webhooks/test",
    },
  })
}
