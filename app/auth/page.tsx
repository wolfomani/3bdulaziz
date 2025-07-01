"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Github, Phone, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [step, setStep] = useState<"phone" | "verify">("phone")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams.get("error")
    if (error) {
      switch (error) {
        case "github_error":
          setError("حدث خطأ في تسجيل الدخول عبر GitHub")
          break
        case "no_code":
          setError("لم يتم الحصول على رمز التفويض")
          break
        case "auth_failed":
          setError("فشل في المصادقة")
          break
        case "server_error":
          setError("حدث خطأ في الخادم")
          break
        default:
          setError("حدث خطأ غير متوقع")
      }
    }
  }, [searchParams])

  const handleGitHubLogin = () => {
    setIsLoading(true)
    window.location.href = "/api/auth/github"
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
        setSuccess("تم إرسال رمز التحقق بنجاح")
        setStep("verify")
      } else {
        setError(data.message || "فشل في إرسال رمز التحقق")
      }
    } catch (error) {
      setError("حدث خطأ في الاتصال")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeVerify = async (e: React.FormEvent) => {
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
        setSuccess("تم التحقق بنجاح")
        router.push("/dashboard")
      } else {
        setError(data.message || "رمز التحقق غير صحيح")
      }
    } catch (error) {
      setError("حدث خطأ في الاتصال")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-block mb-6">
            <div className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
              عبد العزيز الحمداني
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">مرحباً بك</h1>
          <p className="text-gray-400">سجل دخولك للوصول إلى المساعد الذكي</p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <Alert className="border-red-500/50 bg-red-500/10">
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <AlertDescription className="text-green-400">{success}</AlertDescription>
          </Alert>
        )}

        {/* GitHub Login */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardContent className="p-6">
            <Button
              onClick={handleGitHubLogin}
              disabled={isLoading}
              className="w-full bg-[#24292e] hover:bg-[#1a1e22] text-white"
            >
              {isLoading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Github className="w-4 h-4 ml-2" />}
              تسجيل الدخول عبر GitHub
            </Button>
          </CardContent>
        </Card>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-black text-gray-400">أو</span>
          </div>
        </div>

        {/* Phone Login */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Phone className="w-5 h-5 ml-2" />
              تسجيل الدخول برقم الهاتف
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === "phone" ? (
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="phone" className="text-gray-300">
                    رقم الهاتف
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+968 9X XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4 ml-2" />
                  )}
                  إرسال رمز التحقق
                </Button>
              </form>
            ) : (
              <form onSubmit={handleCodeVerify} className="space-y-4">
                <div>
                  <Label htmlFor="code" className="text-gray-300">
                    رمز التحقق
                  </Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    maxLength={6}
                    required
                  />
                  <p className="text-sm text-gray-400 mt-1">تم إرسال الرمز إلى {phone}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("phone")}
                    className="flex-1 border-white/30 text-white hover:bg-white/10 bg-transparent"
                  >
                    رجوع
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4 ml-2" />
                    )}
                    تحقق
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-400">
          <p>
            بالمتابعة، أنت توافق على{" "}
            <Link href="/terms" className="text-red-400 hover:underline">
              شروط الاستخدام
            </Link>{" "}
            و{" "}
            <Link href="/privacy" className="text-red-400 hover:underline">
              سياسة الخصوصية
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
