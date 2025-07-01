import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ success: false, message: "رقم الهاتف مطلوب" }, { status: 400 })
    }

    // For demo purposes, we'll simulate SMS sending
    // In production, you would integrate with Twilio or similar service
    console.log(`Sending SMS to ${phone}`)

    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Store the code temporarily (in production, use Redis or database)
    // For now, we'll just log it
    console.log(`Verification code for ${phone}: ${code}`)

    return NextResponse.json({
      success: true,
      message: "تم إرسال رمز التحقق بنجاح",
    })
  } catch (error) {
    console.error("Send phone verification error:", error)
    return NextResponse.json({ success: false, message: "حدث خطأ في إرسال رمز التحقق" }, { status: 500 })
  }
}
