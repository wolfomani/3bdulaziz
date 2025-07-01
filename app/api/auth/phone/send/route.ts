import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import twilio from "twilio"

const twilioClient = twilio(process.env.TWILIO_SID!, process.env.TWILIO_TOKEN!)

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    // التحقق من صيغة رقم الهاتف
    const phoneRegex = /^\+[1-9]\d{1,14}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number format. Use international format (+1234567890)" },
        { status: 400 },
      )
    }

    // إنشاء رمز التحقق
    const verificationCode = await AuthService.createPhoneVerification(phone)

    // إرسال الرسالة النصية
    try {
      await twilioClient.messages.create({
        body: `رمز التحقق الخاص بك هو: ${verificationCode}\nYour verification code is: ${verificationCode}`,
        from: process.env.TWILIO_PHONE!,
        to: phone,
      })

      return NextResponse.json({
        success: true,
        message: "Verification code sent successfully",
        message_ar: "تم إرسال رمز التحقق بنجاح",
      })
    } catch (twilioError) {
      console.error("Twilio error:", twilioError)

      // في حالة فشل Twilio، نعيد الرمز للاختبار (في بيئة التطوير فقط)
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json({
          success: true,
          message: "Verification code sent (dev mode)",
          code: verificationCode, // فقط في بيئة التطوير
        })
      }

      return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 })
    }
  } catch (error) {
    console.error("Phone verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
