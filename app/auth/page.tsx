"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Github, Phone, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [phoneMode, setPhoneMode] = useState(false)
  const [verificationMode, setVerificationMode] = useState(false)
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam) {
      switch (errorParam) {
        case "github_error":
          setError("حدث خطأ في تسجيل الدخول عبر GitHub")
          break
        case "no_code":
          setError("لم يتم استلام رمز التفويض")
          break
        case "callback_failed":
          setError("فشل في معالجة تسجيل الدخول")
          break
        default:
          setError("حدث خطأ غير متوقع")
      }
    }
  }, [searchParams])

  const handleGitHubLogin = async () => {
    setIsLoading(true)
    try {
      window.location.href = "/api/auth/github"
    } catch (error) {
      setError("فشل في بدء تسجيل الدخول عبر GitHub")
      setIsLoading(false)
    }
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/phone/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      })

      const data = await response.json()

      if (data.success) {
        setVerificationMode(true)
        toast.success("تم إرسال رمز التحقق")
      } else {
        setError(data.message || "فشل في إرسال رمز التحقق")
      }
    } catch (error) {
      setError("حدث خطأ في الاتصال")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("تم تسجيل الدخول بنجاح")
        router.push("/dashboard")
      } else {
        setError(data.message || "رمز التحقق غير صحيح")
      }
    } catch (error) {
      setError("حدث خطأ في التحقق")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">تسجيل الدخول</CardTitle>
          <CardDescription>
            {phoneMode
              ? verificationMode
                ? "أدخل رمز التحقق المرسل إلى هاتفك"
                : "أدخل رقم هاتفك للحصول على رمز التحقق"
              : "اختر طريقة تسجيل الدخول"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!phoneMode ? (
            // Main login options
            <div className="space-y-4">
              <Button
                onClick={handleGitHubLogin}
                disabled={isLoading}
                className="w-full bg-transparent"
                variant="outline"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Github className="mr-2 h-4 w-4" />}
                تسجيل الدخول عبر GitHub
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">أو</span>
                </div>
              </div>

              <Button onClick={() => setPhoneMode(true)} variant="outline" className="w-full">
                <Phone className="mr-2 h-4 w-4" />
                تسجيل الدخول برقم الهاتف
              </Button>
            </div>
          ) : verificationMode ? (
            // Code verification form
            <form onSubmit={handleCodeVerification} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">رمز التحقق</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  required
                  className="text-center text-lg tracking-widest"
                />
              </div>

              <Button type="submit" disabled={isLoading || code.length !== 6} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                تحقق من الرمز
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setVerificationMode(false)
                  setCode("")
                  setError("")
                }}
                className="w-full"
              >
                العودة
              </Button>
            </form>
          ) : (
            // Phone number form
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+966501234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  dir="ltr"
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                إرسال رمز التحقق
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setPhoneMode(false)
                  setPhone("")
                  setError("")
                }}
                className="w-full"
              >
                العودة
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
