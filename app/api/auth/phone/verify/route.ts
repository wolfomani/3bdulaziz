import { type NextRequest, NextResponse } from "next/server"
import { verifyPhoneCode } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json()

    if (!phone || !code) {
      return NextResponse.json({ success: false, message: "رقم الهاتف ورمز التحقق مطلوبان" }, { status: 400 })
    }

    const result = await verifyPhoneCode(phone, code)

    if (result) {
      const response = NextResponse.json({
        success: true,
        message: "تم تسجيل الدخول بنجاح",
        user: {
          id: result.user.id,
          name: result.user.name,
          phone: result.user.phone,
          provider: result.user.provider,
        },
      })

      // Set secure cookie
      response.cookies.set("auth_token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      })

      return response
    } else {
      return NextResponse.json({ success: false, message: "رمز التحقق غير صحيح أو منتهي الصلاحية" }, { status: 400 })
    }
  } catch (error) {
    console.error("Phone verification error:", error)
    return NextResponse.json({ success: false, message: "خطأ في الخادم" }, { status: 500 })
  }
}
