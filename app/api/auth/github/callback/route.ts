import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      console.error("GitHub OAuth error:", error)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "https://v0-drx3apipage2-git-main-balqees0alalawi-gmailcoms-projects.vercel.app"}/auth?error=github_error`,
      )
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "https://v0-drx3apipage2-git-main-balqees0alalawi-gmailcoms-projects.vercel.app"}/auth?error=no_code`,
      )
    }

    const result = await AuthService.handleGitHubCallback(code)

    if (!result.success || !result.session) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "https://v0-drx3apipage2-git-main-balqees0alalawi-gmailcoms-projects.vercel.app"}/auth?error=auth_failed`,
      )
    }

    // Set auth cookie
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "https://v0-drx3apipage2-git-main-balqees0alalawi-gmailcoms-projects.vercel.app"}/dashboard`,
    )
    response.cookies.set("auth_token", result.session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("GitHub callback error:", error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "https://v0-drx3apipage2-git-main-balqees0alalawi-gmailcoms-projects.vercel.app"}/auth?error=server_error`,
    )
  }
}
