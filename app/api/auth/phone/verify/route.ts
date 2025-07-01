import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, code } = await request.json()

    if (!phoneNumber || !code) {
      return NextResponse.json({ error: "Phone number and verification code are required" }, { status: 400 })
    }

    try {
      // Check verification code
      const verification = await sql`
        SELECT * FROM phone_verifications 
        WHERE phone_number = ${phoneNumber} 
        AND code = ${code}
        AND expires_at > NOW()
        AND verified = false
      `

      if (verification.length === 0) {
        return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 })
      }

      // Mark as verified
      await sql`
        UPDATE phone_verifications 
        SET verified = true 
        WHERE phone_number = ${phoneNumber} AND code = ${code}
      `

      // Check if user exists
      let user = await sql`
        SELECT * FROM users WHERE phone_number = ${phoneNumber}
      `

      if (user.length === 0) {
        // Create new user
        const newUser = await sql`
          INSERT INTO users (phone_number, created_at, last_login)
          VALUES (${phoneNumber}, NOW(), NOW())
          RETURNING id, phone_number, created_at
        `
        user = newUser
      } else {
        // Update last login
        await sql`
          UPDATE users 
          SET last_login = NOW() 
          WHERE phone_number = ${phoneNumber}
        `
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user[0].id,
          phoneNumber: user[0].phone_number,
        },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" },
      )

      // Set HTTP-only cookie
      const response = NextResponse.json({
        success: true,
        message: "Phone number verified successfully",
        user: {
          id: user[0].id,
          phoneNumber: user[0].phone_number,
          createdAt: user[0].created_at,
        },
      })

      response.cookies.set("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      })

      return response
    } catch (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ error: "Database error during verification" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error verifying phone number:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
