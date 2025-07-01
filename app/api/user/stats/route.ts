import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import DrXDatabase from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const user = await verifyToken(token)

    if (!user) {
      return NextResponse.json({ error: "رمز غير صالح" }, { status: 401 })
    }

    // Get user statistics
    const stats = await DrXDatabase.getUserStats(user.id)

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error("User stats error:", error)
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 })
  }
}
