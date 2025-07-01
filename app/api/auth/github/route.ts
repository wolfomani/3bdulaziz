import { type NextRequest, NextResponse } from "next/server"
import { AuthService, setSessionCookie } from "@/lib/auth"

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!
const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI!

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")

  if (!code) {
    // إعادة توجيه إلى GitHub للمصادقة
    const githubAuthUrl = new URL("https://github.com/login/oauth/authorize")
    githubAuthUrl.searchParams.set("client_id", GITHUB_CLIENT_ID)
    githubAuthUrl.searchParams.set("redirect_uri", GITHUB_REDIRECT_URI)
    githubAuthUrl.searchParams.set("scope", "user:email")
    githubAuthUrl.searchParams.set("state", Math.random().toString(36).substring(7))

    return NextResponse.redirect(githubAuthUrl.toString())
  }

  try {
    // تبديل الكود بـ access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_REDIRECT_URI,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenData.access_token) {
      throw new Error("Failed to get access token")
    }

    // الحصول على بيانات المستخدم من GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    const githubUser = await userResponse.json()

    // الحصول على البريد الإلكتروني
    const emailResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    const emails = await emailResponse.json()
    const primaryEmail = emails.find((email: any) => email.primary)?.email

    // البحث عن مستخدم موجود أو إنشاء جديد
    let user = await AuthService.findUser({
      github_id: githubUser.id.toString(),
      email: primaryEmail,
    })

    if (!user) {
      user = await AuthService.createUser({
        github_id: githubUser.id.toString(),
        github_username: githubUser.login,
        name: githubUser.name || githubUser.login,
        email: primaryEmail,
        avatar_url: githubUser.avatar_url,
        is_verified: true,
      })
    } else {
      // تحديث البيانات
      await AuthService.db.query(
        `
        UPDATE users SET 
          github_username = $1, 
          name = COALESCE($2, name),
          avatar_url = COALESCE($3, avatar_url),
          last_login = NOW()
        WHERE id = $4
      `,
        [githubUser.login, githubUser.name, githubUser.avatar_url, user.id],
      )
    }

    // إنشاء جلسة
    const userAgent = request.headers.get("user-agent") || undefined
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    const sessionId = await AuthService.createSession(user.id, userAgent, ipAddress)

    // تعيين كوكي الجلسة
    setSessionCookie(sessionId)

    // إعادة توجيه إلى الصفحة الرئيسية
    return NextResponse.redirect(new URL("/", request.url))
  } catch (error) {
    console.error("GitHub auth error:", error)
    return NextResponse.redirect(new URL("/auth?error=github_auth_failed", request.url))
  }
}

export async function POST() {
  // بدء عملية المصادقة مع GitHub
  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize")
  githubAuthUrl.searchParams.set("client_id", GITHUB_CLIENT_ID)
  githubAuthUrl.searchParams.set("redirect_uri", GITHUB_REDIRECT_URI)
  githubAuthUrl.searchParams.set("scope", "user:email")
  githubAuthUrl.searchParams.set("state", Math.random().toString(36).substring(7))

  return NextResponse.json({
    success: true,
    auth_url: githubAuthUrl.toString(),
  })
}
