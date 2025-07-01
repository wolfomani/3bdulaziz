import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { WebhookHandler } from "@/lib/webhook-handler"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const stats = await WebhookHandler.getWebhookStats()

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error("Webhook stats error:", error)
    return NextResponse.json({ success: false, message: "خطأ في تحميل الإحصائيات" }, { status: 500 })
  }
}
