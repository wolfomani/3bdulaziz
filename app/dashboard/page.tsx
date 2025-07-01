"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, BarChart3, LogOut, Bot, Zap, Clock, TrendingUp, Github, Phone } from "lucide-react"
import { toast } from "sonner"

interface DashboardUser {
  id: string
  name: string
  email?: string
  phone?: string
  avatar?: string
  provider: "github" | "phone"
}

interface UserStats {
  totalConversations: number
  totalMessages: number
  tokensUsed: number
  favoriteModel: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<DashboardUser | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
    loadUserStats()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me")
      const data = await response.json()

      if (data.authenticated) {
        setUser(data.user)
      } else {
        router.push("/auth")
      }
    } catch (error) {
      console.error("Auth check error:", error)
      router.push("/auth")
    } finally {
      setLoading(false)
    }
  }

  const loadUserStats = async () => {
    try {
      const response = await fetch("/api/user/stats")
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Stats loading error:", error)
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" })
      const data = await response.json()

      if (data.success) {
        toast.success("تم تسجيل الخروج بنجاح")
        router.push("/")
      }
    } catch (error) {
      toast.error("حدث خطأ في تسجيل الخروج")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
            </div>
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <Button onClick={() => router.push("/chat")} className="bg-blue-600 hover:bg-blue-700">
                <MessageSquare className="w-4 h-4 mr-2" />
                بدء محادثة جديدة
              </Button>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="w-20 h-20 mx-auto mb-4">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback className="text-lg">{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">{user.name}</CardTitle>
                <CardDescription>
                  <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                    {user.provider === "github" ? <Github className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                    <span>{user.provider === "github" ? "GitHub" : "رقم الهاتف"}</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {user.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">البريد الإلكتروني:</span>
                      <span className="text-sm">{user.email}</span>
                    </div>
                  )}
                  {user.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">الهاتف:</span>
                      <span className="text-sm" dir="ltr">
                        {user.phone}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">المعرف:</span>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {user.id.slice(0, 8)}...
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Cards */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">المحادثات</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalConversations || 0}</div>
                  <p className="text-xs text-muted-foreground">إجمالي المحادثات</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">الرسائل</CardTitle>
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalMessages || 0}</div>
                  <p className="text-xs text-muted-foreground">إجمالي الرسائل</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">الرموز المستخدمة</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.tokensUsed?.toLocaleString() || 0}</div>
                  <p className="text-xs text-muted-foreground">إجمالي الرموز</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">النموذج المفضل</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold truncate">{stats?.favoriteModel || "غير محدد"}</div>
                  <p className="text-xs text-muted-foreground">الأكثر استخداماً</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>الإجراءات السريعة</CardTitle>
                <CardDescription>الوصول السريع للميزات الرئيسية</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => router.push("/chat")}
                    className="h-16 flex flex-col items-center justify-center space-y-2"
                    variant="outline"
                  >
                    <MessageSquare className="w-6 h-6" />
                    <span>محادثة جديدة</span>
                  </Button>

                  <Button
                    onClick={() => router.push("/webhooks")}
                    className="h-16 flex flex-col items-center justify-center space-y-2"
                    variant="outline"
                  >
                    <BarChart3 className="w-6 h-6" />
                    <span>إدارة Webhooks</span>
                  </Button>

                  <Button
                    onClick={() => router.push("/blog")}
                    className="h-16 flex flex-col items-center justify-center space-y-2"
                    variant="outline"
                  >
                    <Clock className="w-6 h-6" />
                    <span>المدونة</span>
                  </Button>

                  <Button
                    onClick={() => window.open("https://github.com/wolfomani/3bdulaziz", "_blank")}
                    className="h-16 flex flex-col items-center justify-center space-y-2"
                    variant="outline"
                  >
                    <Github className="w-6 h-6" />
                    <span>المشروع على GitHub</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
