import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, logout } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value

    if (token) {
      const user = await verifyToken(token)
      if (user) {
        await logout(user.id)
      }
    }

    const response = NextResponse.json({ success: true, message: "تم تسجيل الخروج بنجاح" })

    // Clear cookie
    response.cookies.set("auth_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "فشل في تسجيل الخروج" }, { status: 500 })
  }
}
