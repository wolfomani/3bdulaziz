import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ success: false, message: "غير مصرح" }, { status: 401 })
    }

    const result = await AuthService.validateSession(token)

    if (!result) {
      return NextResponse.json({ success: false, message: "جلسة غير صالحة" }, { status: 401 })
    }

    // Get user statistics
    const [conversationStats] = await sql`
      SELECT 
        COUNT(DISTINCT id) as total_conversations,
        COUNT(*) as total_messages,
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_response_time
      FROM conversations 
      WHERE user_id = ${result.user.id}
    `

    const [monthlyUsage] = await sql`
      SELECT COUNT(*) as usage_this_month
      FROM conversations 
      WHERE user_id = ${result.user.id}
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `

    // Calculate streak days (simplified)
    const streakDays = 7 // Placeholder

    const stats = {
      total_conversations: Number.parseInt(conversationStats?.total_conversations || "0"),
      total_messages: Number.parseInt(conversationStats?.total_messages || "0"),
      avg_response_time: Math.round(Number.parseFloat(conversationStats?.avg_response_time || "2")),
      favorite_topics: ["الذكاء الاصطناعي", "البرمجة", "التقنية"],
      usage_this_month: Number.parseInt(monthlyUsage?.usage_this_month || "0"),
      streak_days: streakDays,
    }

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error("Get user stats error:", error)
    return NextResponse.json({ success: false, message: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
