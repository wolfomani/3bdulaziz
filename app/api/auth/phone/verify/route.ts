import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json()

    if (!phone || !code) {
      return NextResponse.json({ success: false, message: "رقم الهاتف والرمز مطلوبان" }, { status: 400 })
    }

    // For demo purposes, accept any 6-digit code
    // In production, you would verify against stored code
    if (code.length !== 6) {
      return NextResponse.json({ success: false, message: "رمز التحقق يجب أن يكون 6 أرقام" }, { status: 400 })
    }

    // Create or get user
    let user = await AuthService.findUser(phone)
    if (!user) {
      user = await AuthService.createOrUpdateUser({
        phone,
        is_verified: true,
        name: `مستخدم ${phone.slice(-4)}`,
      })
    }

    // Create session
    const session = await AuthService.createSession(user.id)

    const response = NextResponse.json({
      success: true,
      message: "تم التحقق بنجاح",
      user,
    })

    // Set auth cookie
    response.cookies.set("auth_token", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Verify phone code error:", error)
    return NextResponse.json({ success: false, message: "حدث خطأ في التحقق من الرمز" }, { status: 500 })
  }
}
