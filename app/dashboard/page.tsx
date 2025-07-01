"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Settings, LogOut, Github, Phone, Mail, Calendar, Activity, TrendingUp, Zap } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface User {
  id: string
  name?: string
  email?: string
  phone?: string
  avatar?: string
  github_username?: string
  created_at: string
  last_login?: string
  is_verified: boolean
}

interface UserStats {
  total_conversations: number
  total_messages: number
  avg_response_time: number
  favorite_topics: string[]
  usage_this_month: number
  streak_days: number
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const router = useRouter()

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      // Load user info
      const userResponse = await fetch("/api/auth/me")
      const userData = await userResponse.json()

      if (!userData.success) {
        router.push("/auth")
        return
      }

      setUser(userData.user)

      // Load user stats
      const statsResponse = await fetch("/api/user/stats")
      const statsData = await statsResponse.json()

      if (statsData.success) {
        setStats(statsData.stats)
      }
    } catch (error) {
      console.error("Failed to load user data:", error)
      router.push("/auth")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-black flex items-center justify-center">
        <div className="text-white">جاري التحميل...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-black">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent"
            >
              عبد العزيز الحمداني
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/chat">
                <Button className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600">
                  <MessageSquare className="w-4 h-4 ml-2" />
                  المحادثة
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="border-white/30 text-white hover:bg-white/10 bg-transparent"
              >
                <LogOut className="w-4 h-4 ml-2" />
                {isLoggingOut ? "جاري الخروج..." : "تسجيل خروج"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Profile */}
          <div className="lg:col-span-1">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white">الملف الشخصي</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
                      {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{user.name || "مستخدم"}</h3>
                    {user.is_verified && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">محقق</Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {user.email && (
                    <div className="flex items-center text-gray-300">
                      <Mail className="w-4 h-4 ml-2" />
                      <span className="text-sm">{user.email}</span>
                    </div>
                  )}

                  {user.phone && (
                    <div className="flex items-center text-gray-300">
                      <Phone className="w-4 h-4 ml-2" />
                      <span className="text-sm">{user.phone}</span>
                    </div>
                  )}

                  {user.github_username && (
                    <div className="flex items-center text-gray-300">
                      <Github className="w-4 h-4 ml-2" />
                      <span className="text-sm">@{user.github_username}</span>
                    </div>
                  )}

                  <div className="flex items-center text-gray-300">
                    <Calendar className="w-4 h-4 ml-2" />
                    <span className="text-sm">انضم في {formatDate(user.created_at)}</span>
                  </div>

                  {user.last_login && (
                    <div className="flex items-center text-gray-300">
                      <Activity className="w-4 h-4 ml-2" />
                      <span className="text-sm">آخر دخول: {formatDate(user.last_login)}</span>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full bg-transparent"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 bg-transparent"
                >
                  <Settings className="w-4 h-4 ml-2" />
                  تعديل الملف الشخصي
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Stats and Activity */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/chat">
                <Card className="bg-gradient-to-r from-red-600/20 to-orange-500/20 backdrop-blur-sm border-red-500/30 hover:from-red-600/30 hover:to-orange-500/30 transition-all cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <MessageSquare className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <h3 className="font-semibold text-white">بدء محادثة</h3>
                    <p className="text-sm text-gray-300">تحدث مع المساعد الذكي</p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/webhooks">
                <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <h3 className="font-semibold text-white">Webhooks</h3>
                    <p className="text-sm text-gray-300">إدارة التكاملات</p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/blog">
                <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <h3 className="font-semibold text-white">المدونة</h3>
                    <p className="text-sm text-gray-300">آخر المقالات</p>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Usage Statistics */}
            {stats && (
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">إحصائيات الاستخدام</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">{stats.total_conversations}</div>
                      <div className="text-sm text-gray-400">محادثة</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-400">{stats.total_messages}</div>
                      <div className="text-sm text-gray-400">رسالة</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{stats.avg_response_time}s</div>
                      <div className="text-sm text-gray-400">متوسط الاستجابة</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{stats.streak_days}</div>
                      <div className="text-sm text-gray-400">يوم متتالي</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white">النشاط الأخير</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-white text-sm">تم تسجيل الدخول بنجاح</p>
                      <p className="text-gray-400 text-xs">منذ دقائق قليلة</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-white text-sm">تم إنشاء محادثة جديدة</p>
                      <p className="text-gray-400 text-xs">اليوم</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-white text-sm">تم تحديث الملف الشخصي</p>
                      <p className="text-gray-400 text-xs">أمس</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
