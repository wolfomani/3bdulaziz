import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Mock SMS service - replace with actual SMS provider like Twilio
async function sendSMS(phoneNumber: string, code: string) {
  console.log(`Sending SMS to ${phoneNumber}: Your verification code is ${code}`)
  // In production, integrate with Twilio, AWS SNS, or similar service
  return true
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    if (!phoneRegex.test(phoneNumber.replace(/\s+/g, ""))) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 })
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Set expiration time (5 minutes from now)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    try {
      // Store verification code in database
      await sql`
        INSERT INTO phone_verifications (phone_number, code, expires_at, created_at)
        VALUES (${phoneNumber}, ${verificationCode}, ${expiresAt}, NOW())
        ON CONFLICT (phone_number) 
        DO UPDATE SET 
          code = ${verificationCode},
          expires_at = ${expiresAt},
          created_at = NOW(),
          verified = false
      `

      // Send SMS (mock implementation)
      await sendSMS(phoneNumber, verificationCode)

      return NextResponse.json({
        success: true,
        message: "Verification code sent successfully",
      })
    } catch (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ error: "Failed to store verification code" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error sending verification code:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
