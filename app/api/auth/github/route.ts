import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID

    if (!clientId) {
      return NextResponse.json({ error: "GitHub OAuth غير مكون" }, { status: 500 })
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`
    const scope = "user:email"
    const state = Math.random().toString(36).substring(7)

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`

    return NextResponse.redirect(githubAuthUrl)
  } catch (error) {
    console.error("GitHub OAuth initiation error:", error)
    return NextResponse.json({ error: "فشل في بدء تسجيل الدخول" }, { status: 500 })
  }
}
