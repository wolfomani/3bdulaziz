import { type NextRequest, NextResponse } from "next/server"
import { sendPhoneVerification } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ success: false, message: "رقم الهاتف مطلوب" }, { status: 400 })
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ success: false, message: "تنسيق رقم الهاتف غير صحيح" }, { status: 400 })
    }

    const result = await sendPhoneVerification(phone)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "تم إرسال رمز التحقق",
        // Include code in development only
        ...(process.env.NODE_ENV === "development" && { code: result.code }),
      })
    } else {
      return NextResponse.json({ success: false, message: "فشل في إرسال رمز التحقق" }, { status: 500 })
    }
  } catch (error) {
    console.error("Phone verification send error:", error)
    return NextResponse.json({ success: false, message: "خطأ في الخادم" }, { status: 500 })
  }
}
