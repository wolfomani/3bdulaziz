"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  MessageSquare,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  Github,
  Phone,
  Bot,
  Sparkles,
  TrendingUp,
  Users,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { FireParticles } from "@/components/fire-particles"

interface User {
  id: string
  name?: string
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me")
      const data = await response.json()

      if (data.success) {
        setUser(data.user)
      }
    } catch (error) {
      console.error("Auth check error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const features = [
    {
      icon: <Bot className="w-8 h-8" />,
      title: "ذكاء اصطناعي متقدم",
      description: "نماذج ذكية متعددة تدعم اللغة العربية والإنجليزية",
      color: "from-red-500 to-orange-500",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "استجابة فورية",
      description: "ردود سريعة ودقيقة في ثوانٍ معدودة",
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "آمن ومحمي",
      description: "حماية كاملة لبياناتك ومحادثاتك",
      color: "from-green-500 to-blue-500",
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "متعدد اللغات",
      description: "دعم كامل للعربية والإنجليزية",
      color: "from-blue-500 to-purple-500",
    },
  ]

  const stats = [
    { label: "مستخدم نشط", value: "10K+", icon: <Users className="w-5 h-5" /> },
    { label: "محادثة يومياً", value: "50K+", icon: <MessageSquare className="w-5 h-5" /> },
    { label: "وقت الاستجابة", value: "<2s", icon: <Clock className="w-5 h-5" /> },
    { label: "دقة الإجابات", value: "95%", icon: <TrendingUp className="w-5 h-5" /> },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-black">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0">
        <FireParticles />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/10 via-transparent to-transparent" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
              عبد العزيز الحمداني
            </div>
            <div className="flex items-center gap-4">
              {!isLoading &&
                (user ? (
                  <div className="flex items-center gap-4">
                    <span className="text-white">مرحباً، {user.name || "مستخدم"}</span>
                    <Link href="/dashboard">
                      <Button className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600">
                        لوحة التحكم
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <Link href="/auth">
                    <Button className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600">
                      تسجيل الدخول
                    </Button>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="mb-8">
              <Badge className="bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-300 border-red-500/30 mb-4">
                <Sparkles className="w-4 h-4 ml-2" />
                الجيل الجديد من الذكاء الاصطناعي
              </Badge>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              مساعدك الذكي
              <span className="block bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                باللغة العربية
              </span>
            </h1>

            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              تجربة محادثة ذكية متطورة تدعم اللغة العربية بشكل كامل. اسأل أي سؤال واحصل على إجابات دقيقة وسريعة من أحدث
              نماذج الذكاء الاصطناعي.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {user ? (
                <Link href="/chat">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-lg px-8 py-3"
                  >
                    <MessageSquare className="w-5 h-5 ml-2" />
                    بدء المحادثة الآن
                  </Button>
                </Link>
              ) : (
                <Link href="/auth">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-lg px-8 py-3"
                  >
                    <ArrowRight className="w-5 h-5 ml-2" />
                    ابدأ مجاناً
                  </Button>
                </Link>
              )}
              <Link href="/blog">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-3 bg-transparent"
                >
                  تعرف على المزيد
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-2">
                    <div className="p-3 rounded-full bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-400">
                      {stat.icon}
                    </div>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">لماذا تختار مساعدنا الذكي؟</h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                تقنيات متطورة وميزات فريدة تجعل تجربتك مع الذكاء الاصطناعي استثنائية
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300"
                >
                  <CardHeader>
                    <div
                      className={`w-16 h-16 rounded-full bg-gradient-to-r ${feature.color} flex items-center justify-center text-white mb-4`}
                    >
                      {feature.icon}
                    </div>
                    <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Card className="bg-gradient-to-r from-red-900/20 to-orange-900/20 backdrop-blur-sm border-red-500/30">
              <CardContent className="p-12">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">جاهز لتجربة المستقبل؟</h2>
                <p className="text-xl text-gray-300 mb-8">
                  انضم إلى آلاف المستخدمين الذين يستفيدون من قوة الذكاء الاصطناعي يومياً
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {user ? (
                    <Link href="/chat">
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-lg px-8 py-3"
                      >
                        <MessageSquare className="w-5 h-5 ml-2" />
                        بدء المحادثة
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/auth">
                        <Button
                          size="lg"
                          className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-lg px-8 py-3"
                        >
                          <Github className="w-5 h-5 ml-2" />
                          تسجيل دخول بـ GitHub
                        </Button>
                      </Link>
                      <Link href="/auth">
                        <Button
                          size="lg"
                          variant="outline"
                          className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-3 bg-transparent"
                        >
                          <Phone className="w-5 h-5 ml-2" />
                          تسجيل دخول بالهاتف
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mb-4">
                عبد العزيز الحمداني
              </div>
              <p className="text-gray-400 mb-4">
                مساعد ذكي متطور يدعم اللغة العربية ويقدم تجربة محادثة استثنائية مع أحدث تقنيات الذكاء الاصطناعي.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">روابط سريعة</h3>
              <div className="space-y-2">
                <Link href="/chat" className="block text-gray-400 hover:text-white transition-colors">
                  المحادثة
                </Link>
                <Link href="/blog" className="block text-gray-400 hover:text-white transition-colors">
                  المدونة
                </Link>
                <Link href="/webhooks" className="block text-gray-400 hover:text-white transition-colors">
                  Webhooks
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">الدعم</h3>
              <div className="space-y-2">
                <Link href="/terms" className="block text-gray-400 hover:text-white transition-colors">
                  شروط الاستخدام
                </Link>
                <Link href="/privacy" className="block text-gray-400 hover:text-white transition-colors">
                  سياسة الخصوصية
                </Link>
                <Link href="/contact" className="block text-gray-400 hover:text-white transition-colors">
                  اتصل بنا
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-8 text-center">
            <p className="text-gray-400">© 2024 عبد العزيز الحمداني. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
