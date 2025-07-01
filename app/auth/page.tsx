"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Github, Phone, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [phone, setPhone] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [countdown, setCountdown] = useState(0)
  const router = useRouter()

  // عد تنازلي لإعادة الإرسال
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // تسجيل الدخول عبر GitHub
  const handleGitHubLogin = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/github", {
        method: "POST",
      })

      const data = await response.json()

      if (data.success && data.auth_url) {
        window.location.href = data.auth_url
      } else {
        throw new Error("Failed to initiate GitHub authentication")
      }
    } catch (err) {
      setError("فشل في تسجيل الدخول عبر GitHub")
      console.error("GitHub auth error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // إرسال رمز التحقق للهاتف
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setMessage("")

    // التحقق من صيغة رقم الهاتف
    const phoneRegex = /^\+[1-9]\d{1,14}$/
    if (!phoneRegex.test(phone)) {
      setError("يرجى إدخال رقم الهاتف بالصيغة الدولية (مثال: +96812345678)")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/phone/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      })

      const data = await response.json()

      if (data.success) {
        setIsCodeSent(true)
        setMessage("تم إرسال رمز التحقق إلى هاتفك")
        setCountdown(60) // 60 ثانية قبل إمكانية الإرسال مرة أخرى

        // في بيئة التطوير، اعرض الرمز
        if (data.code) {
          setMessage(`رمز التحقق (للاختبار): ${data.code}`)
        }
      } else {
        setError(data.error || "فشل في إرسال رمز التحقق")
      }
    } catch (err) {
      setError("حدث خطأ في الشبكة")
      console.error("Send code error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // التحقق من الرمز
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (verificationCode.length !== 6) {
      setError("يجب أن يكون رمز التحقق مكوناً من 6 أرقام")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/phone/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, code: verificationCode }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage("تم تسجيل الدخول بنجاح!")
        setTimeout(() => {
          router.push("/")
        }, 1500)
      } else {
        setError(data.error || "رمز التحقق غير صحيح")
      }
    } catch (err) {
      setError("حدث خطأ في التحقق")
      console.error("Verify code error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">مرحباً بك</CardTitle>
          <CardDescription>سجل الدخول للوصول إلى منصة الذكاء الاصطناعي</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="github" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="github" className="flex items-center gap-2">
                <Github className="w-4 h-4" /> تسجيل الدخول عبر GitHub
              </TabsTrigger>
              <TabsTrigger value="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" /> تسجيل الدخول عبر الهاتف
              </TabsTrigger>
            </TabsList>
            <TabsContent value="github">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Button onClick={handleGitHubLogin} disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />} تسجيل
                  الدخول عبر GitHub
                </Button>
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>
            <TabsContent value="phone">
              <form onSubmit={handleSendCode} className="flex flex-col space-y-4">
                <Input
                  type="tel"
                  placeholder="رقم الهاتف الدولي"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading || isCodeSent}
                />
                <Button type="submit" disabled={isLoading || isCodeSent}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "إرسال رمز التحقق"}
                </Button>
                {message && (
                  <Alert variant="success">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </form>
              {isCodeSent && (
                <form onSubmit={handleVerifyCode} className="flex flex-col space-y-4 mt-4">
                  <Input
                    type="text"
                    placeholder="رمز التحقق"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    disabled={isLoading}
                  />
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "تحقق من الرمز"}
                  </Button>
                  {message && (
                    <Alert variant="success">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>{message}</AlertDescription>
                    </Alert>
                  )}
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  {countdown > 0 && (
                    <div className="text-sm text-center mt-2">يمكنك إعادة إرسال الرمز بعد {countdown} ثانية</div>
                  )}
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
