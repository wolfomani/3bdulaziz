import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value

    if (token) {
      await AuthService.logout(token)
    }

    const response = NextResponse.json({ success: true, message: "تم تسجيل الخروج بنجاح" })
    response.cookies.delete("auth_token")

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ success: false, message: "حدث خطأ أثناء تسجيل الخروج" }, { status: 500 })
  }
}
