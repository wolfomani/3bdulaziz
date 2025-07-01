import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")

  if (!code) {
    // Redirect to GitHub OAuth
    const clientId = process.env.GITHUB_CLIENT_ID || "Ov23liupXR6o8HmvL3Nj"
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "https://v0-drx3apipage2-git-main-balqees0alalawi-gmailcoms-projects.vercel.app"}/api/auth/github/callback`

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`

    return NextResponse.redirect(githubAuthUrl)
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID!,
        client_secret: process.env.GITHUB_CLIENT_SECRET!,
        code,
      }),
    })

    const tokenData = await tokenResponse.json()
    if (!tokenData.access_token) {
      throw new Error("Failed to get access token")
    }

    // Get user info from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github+json",
      },
    })

    const githubUser = await userResponse.json()

    // Create or update user
    let user = await AuthService.findUserByGitHubId(githubUser.id.toString())
    if (!user) {
      user = await AuthService.createOrUpdateUser({
        email: githubUser.email,
        name: githubUser.name || githubUser.login,
        avatar: githubUser.avatar_url,
        github_id: githubUser.id.toString(),
        github_username: githubUser.login,
        is_verified: true,
        metadata: {
          github_profile: githubUser,
        },
      })
    }

    // Create session
    const session = await AuthService.createSession(user.id, request)

    // Set cookie and redirect
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "https://v0-drx3apipage2-git-main-balqees0alalawi-gmailcoms-projects.vercel.app"}/dashboard`,
    )
    response.cookies.set("auth_token", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("GitHub OAuth error:", error)
    return NextResponse.json({ success: false, message: "خطأ في المصادقة" }, { status: 500 })
  }
}
