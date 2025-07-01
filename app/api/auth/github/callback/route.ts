import { type NextRequest, NextResponse } from "next/server"
import { handleGitHubCallback } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth?error=github_error`)
    }

    if (!code) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth?error=no_code`)
    }

    const { user, token } = await handleGitHubCallback(code)

    // Set secure cookie
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`)

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("GitHub callback error:", error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth?error=callback_failed`)
  }
}
