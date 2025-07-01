import { type NextRequest, NextResponse } from "next/server"
import { WebhookHandler } from "@/lib/webhook-handler"

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const headers: Record<string, string> = {}

    // Extract relevant headers
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    const result = await WebhookHandler.processVercelWebhook(payload, headers)

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    })
  } catch (error) {
    console.error("Vercel webhook error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Vercel webhook endpoint is active",
    timestamp: new Date().toISOString(),
  })
}
