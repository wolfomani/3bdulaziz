import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { WebhookHandler } from "@/lib/webhook-handler"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const headers = Object.fromEntries(request.headers.entries())

    console.log("GitHub webhook received:", {
      event: headers["x-github-event"],
      delivery: headers["x-github-delivery"],
    })

    const result = await WebhookHandler.processGitHubWebhook(payload, headers)

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    })
  } catch (error) {
    console.error("GitHub webhook error:", error)
    return NextResponse.json({ success: false, message: "خطأ في معالجة webhook" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "GitHub Webhook endpoint is active",
    timestamp: new Date().toISOString(),
  })
}
