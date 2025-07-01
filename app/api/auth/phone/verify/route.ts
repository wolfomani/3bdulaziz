import { type NextRequest, NextResponse } from "next/server"
import { AuthService, setSessionCookie } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json()

    if (!phone || !code) {
      return NextResponse.json({ error: "Phone number and verification code are required" }, { status: 400 })
    }

    // التحقق من الرمز
    const isValid = await AuthService.verifyPhoneCode(phone, code)

    if (!isValid) {
      return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 })
    }

    // البحث عن مستخدم موجود أو إنشاء جديد
    let user = await AuthService.findUser({ phone })

    if (!user) {
      user = await AuthService.createUser({
        phone,
        is_verified: true,
      })
    } else {
      // تحديث حالة التحقق
      await AuthService.db.query(
        `
        UPDATE users SET is_verified = true, last_login = NOW() WHERE id = $1
      `,
        [user.id],
      )
    }

    // إنشاء جلسة
    const userAgent = request.headers.get("user-agent") || undefined
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    const sessionId = await AuthService.createSession(user.id, userAgent, ipAddress)

    // تعيين كوكي الجلسة
    setSessionCookie(sessionId)

    return NextResponse.json({
      success: true,
      message: "Phone verified successfully",
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        is_verified: user.is_verified,
      },
    })
  } catch (error) {
    console.error("Phone verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
