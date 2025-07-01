import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "غير مصرح",
          user: null,
        },
        { status: 200 },
      ) // Return 200 instead of 401 to avoid error
    }

    const result = await AuthService.validateSession(token)

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message: "جلسة غير صالحة",
          user: null,
        },
        { status: 200 },
      )
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      message: "تم العثور على المستخدم",
    })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ في الخادم",
        user: null,
      },
      { status: 200 },
    )
  }
}
