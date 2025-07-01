"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import {
  ExternalLink,
  Github,
  Mail,
  ArrowDown,
  Zap,
  Brain,
  Shield,
  Rocket,
  MessageSquare,
  BarChart3,
  Users,
  Star,
  CheckCircle,
  Play,
  ArrowRight,
} from "lucide-react"
import { useEffect, useState } from "react"

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950/20 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/10 via-transparent to-transparent" />
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-red-500/30 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrollY > 50 ? "bg-black/95 backdrop-blur-md py-2 border-b border-white/10" : "py-4"
        }`}
      >
        <div className="mx-auto w-full px-4 lg:px-6 xl:max-w-7xl relative">
          <nav className="flex items-center justify-between gap-4">
            <Link href="/" aria-label="drx3 Homepage" className="z-50">
              <div className="text-2xl font-bold gradient-text hover:scale-105 transition-transform">drx3</div>
            </Link>

            <ul className="ml-3 hidden flex-grow gap-6 lg:flex">
              <li>
                <Link
                  className="text-red-400 font-medium px-3 py-2 text-sm hover:text-red-300 hover:bg-white/5 rounded-lg transition-all duration-200"
                  href="#features"
                >
                  المميزات
                </Link>
              </li>
              <li>
                <Link
                  className="text-white/70 font-medium px-3 py-2 text-sm hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
                  href="#services"
                >
                  الخدمات
                </Link>
              </li>
              <li>
                <Link
                  className="text-white/70 font-medium px-3 py-2 text-sm hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
                  href="#about"
                >
                  من نحن
                </Link>
              </li>
              <li>
                <Link
                  className="text-white/70 font-medium px-3 py-2 text-sm hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
                  href="#contact"
                >
                  تواصل
                </Link>
              </li>
            </ul>

            <div className="flex gap-3">
              <Link href="/chat">
                <Button className="bg-gradient-to-r from-red-600 to-orange-500 text-white hover:from-red-700 hover:to-orange-600 transition-all duration-300 rounded-full px-6 py-2 font-medium shadow-lg hover:shadow-red-500/25">
                  ابدأ المحادثة
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section - محسن */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0" style={{ transform: `translateY(${scrollY * 0.5}px)` }}>
          <div className="absolute -inset-x-0 bottom-28 lg:bottom-12 flex justify-center">
            <div className="max-w-7xl w-full flex justify-center items-center">
              <div className="opacity-5 lg:opacity-10 select-none text-[20rem] lg:text-[25rem] font-bold tracking-wider text-white/20 animate-pulse">
                drx3
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full px-4 lg:px-6 xl:max-w-7xl flex h-full flex-col relative z-10">
          <div className="flex items-center justify-center h-full mt-20">
            <div className="text-center space-y-8 animate-fade-in-up max-w-4xl">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-white/80 border border-white/20 mb-6">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>منصة الذكاء الاصطناعي الأولى عربياً</span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                <span className="gradient-text animate-float">قوة الذكاء الاصطناعي</span>
                <br />
                <span className="text-white">في متناول يدك</span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed animate-slide-in-right">
                منصة drx3 تقدم لك أحدث تقنيات الذكاء الاصطناعي بواجهة سهلة الاستخدام وإمكانيات لا محدودة
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-in-left pt-4">
                <Link href="/chat">
                  <Button className="bg-gradient-to-r from-red-600 to-orange-500 text-white hover:from-red-700 hover:to-orange-600 transition-all duration-300 rounded-full px-8 py-4 text-lg font-medium shadow-xl hover:shadow-red-500/30 hover:scale-105 group">
                    <MessageSquare className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
                    ابدأ الآن مجاناً
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 rounded-full px-8 py-4 text-lg font-medium bg-transparent backdrop-blur-sm group"
                >
                  <Play className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                  شاهد العرض التوضيحي
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-red-400">10K+</div>
                  <div className="text-sm text-gray-400">مستخدم نشط</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-red-400">99.9%</div>
                  <div className="text-sm text-gray-400">وقت التشغيل</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-red-400">24/7</div>
                  <div className="text-sm text-gray-400">دعم فني</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ArrowDown className="w-6 h-6 text-white/60" />
        </div>
      </section>

      {/* Services Section - جديد */}
      <section id="services" className="py-20 relative z-10">
        <div className="mx-auto w-full px-4 lg:px-6 xl:max-w-7xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-gray-400 mb-6 border border-white/10">
              <span>الخدمات</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">حلول ذكية لكل احتياجاتك</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              نقدم مجموعة شاملة من خدمات الذكاء الاصطناعي المصممة لتلبية احتياجاتك
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-red-500/50 transition-all duration-300 group hover:scale-105">
              <CardContent className="p-6">
                <div className="bg-gradient-to-r from-red-600 to-orange-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">المحادثة الذكية</h3>
                <p className="text-gray-400 mb-4">
                  تفاعل مع نماذج الذكاء الاصطناعي المتقدمة للحصول على إجابات دقيقة وسريعة
                </p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    دعم اللغة العربية الكامل
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    استجابة فورية
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-red-500/50 transition-all duration-300 group hover:scale-105">
              <CardContent className="p-6">
                <div className="bg-gradient-to-r from-red-600 to-orange-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">تحليل البيانات</h3>
                <p className="text-gray-400 mb-4">
                  استخراج رؤى قيمة من بياناتك باستخدام خوارزميات التعلم الآلي المتقدمة
                </p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    تحليل في الوقت الفعلي
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    تقارير تفاعلية
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-red-500/50 transition-all duration-300 group hover:scale-105">
              <CardContent className="p-6">
                <div className="bg-gradient-to-r from-red-600 to-orange-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">الحلول المؤسسية</h3>
                <p className="text-gray-400 mb-4">حلول مخصصة للشركات والمؤسسات لتحسين الكفاءة والإنتاجية</p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    تكامل مع الأنظمة الحالية
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    دعم فني متخصص
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section - محسن */}
      <section id="features" className="py-20 relative z-10">
        <div className="mx-auto w-full px-4 lg:px-6 xl:max-w-7xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-gray-400 mb-6 border border-white/10">
              <span>المميزات</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">لماذا تختار drx3؟</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              نجمع بين أحدث التقنيات وسهولة الاستخدام لنقدم لك تجربة استثنائية
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-red-500/50 transition-all duration-300 group hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="bg-gradient-to-r from-red-600 to-orange-500 w-16 h-16 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">سرعة فائقة</h3>
                <p className="text-gray-400">استجابة فورية وأداء متميز في جميع المهام مع زمن استجابة أقل من ثانية</p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-red-500/50 transition-all duration-300 group hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="bg-gradient-to-r from-red-600 to-orange-500 w-16 h-16 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">ذكاء متقدم</h3>
                <p className="text-gray-400">تقنيات الذكاء الاصطناعي الأحدث مع نماذج مدربة على مليارات البيانات</p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-red-500/50 transition-all duration-300 group hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="bg-gradient-to-r from-red-600 to-orange-500 w-16 h-16 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">أمان عالي</h3>
                <p className="text-gray-400">حماية متقدمة لبياناتك مع تشفير من الطراز العسكري وامتثال كامل للمعايير</p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-red-500/50 transition-all duration-300 group hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="bg-gradient-to-r from-red-600 to-orange-500 w-16 h-16 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <Rocket className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">تطوير مستمر</h3>
                <p className="text-gray-400">تحديثات دورية وميزات جديدة مع فريق تطوير يعمل على مدار الساعة</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section - جديد */}
      <section className="py-20 relative z-10">
        <div className="mx-auto w-full px-4 lg:px-6 xl:max-w-7xl">
          <Card className="bg-gradient-to-r from-red-600/20 to-orange-500/20 backdrop-blur-sm border-red-500/30 overflow-hidden">
            <CardContent className="p-12 text-center relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-orange-500/10" />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">جاهز لتجربة المستقبل؟</h2>
                <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                  انضم إلى آلاف المستخدمين الذين يستفيدون من قوة الذكاء الاصطناعي يومياً
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/chat">
                    <Button className="bg-gradient-to-r from-red-600 to-orange-500 text-white hover:from-red-700 hover:to-orange-600 transition-all duration-300 rounded-full px-8 py-4 text-lg font-medium shadow-xl hover:shadow-red-500/30 hover:scale-105 group">
                      <MessageSquare className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
                      ابدأ مجاناً الآن
                      <ArrowRight className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* About Section - محسن */}
      <section id="about" className="py-20 relative z-10">
        <div className="mx-auto w-full px-4 lg:px-6 xl:max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-gray-400 border border-white/10">
                <span>من نحن</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                نحن فريق من المطورين والمبدعين
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed">
                نحن مجموعة من المطورين المتحمسين الذين يؤمنون بقوة التكنولوجيا في تغيير العالم. نعمل على تطوير حلول
                مبتكرة باستخدام أحدث تقنيات الذكاء الاصطناعي والبرمجة.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed">
                هدفنا هو إنشاء منتجات تساعد الناس وتجعل حياتهم أسهل وأكثر إنتاجية. نؤمن بأن الذكاء الاصطناعي يجب أن يكون
                في متناول الجميع، وليس حكراً على الشركات الكبرى.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 rounded-full px-6 py-3 transition-all duration-300 bg-transparent backdrop-blur-sm"
                  asChild
                >
                  <Link href="#contact">
                    <Mail className="size-4 ml-2" />
                    تواصل معنا
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="relative group">
                <img
                  alt="فريق التطوير"
                  loading="lazy"
                  width="500"
                  height="500"
                  className="w-full rounded-2xl shadow-2xl group-hover:scale-105 transition-transform duration-300"
                  src="/images/anime1.jpg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="text-white font-semibold">فريق drx3</div>
                    <div className="text-gray-300 text-sm">مطورون ومبدعون في مجال الذكاء الاصطناعي</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section - محسن */}
      <section id="contact" className="py-20 relative z-10">
        <div className="mx-auto w-full px-4 lg:px-6 xl:max-w-7xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-gray-400 mb-6 border border-white/10">
              <span>تواصل معنا</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">نحن هنا للمساعدة</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              لديك سؤال أو تريد التعاون معنا؟ فريقنا جاهز للرد على استفساراتك
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-red-500/50 transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <Mail className="w-8 h-8 text-red-400 mx-auto mb-4" />
                    <h3 className="font-semibold text-white mb-2">البريد الإلكتروني</h3>
                    <p className="text-gray-400 text-sm">contact@drx3.com</p>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-red-500/50 transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <MessageSquare className="w-8 h-8 text-red-400 mx-auto mb-4" />
                    <h3 className="font-semibold text-white mb-2">الدعم الفني</h3>
                    <p className="text-gray-400 text-sm">24/7 متاح</p>
                  </CardContent>
                </Card>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  className="bg-gradient-to-r from-red-600 to-orange-500 text-white hover:from-red-700 hover:to-orange-600 transition-all duration-300 rounded-full px-6 py-3 font-medium flex-1"
                  asChild
                >
                  <Link href="mailto:contact@drx3.com">
                    <Mail className="size-4 ml-2" />
                    راسلنا الآن
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 rounded-full px-6 py-3 transition-all duration-300 bg-transparent backdrop-blur-sm flex-1"
                  asChild
                >
                  <Link href="https://twitter.com/drx3">
                    <ExternalLink className="size-4 ml-2" />
                    تابعنا على تويتر
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="relative group">
                <img
                  alt="تواصل معنا"
                  loading="lazy"
                  width="400"
                  height="400"
                  className="w-full rounded-2xl shadow-2xl group-hover:scale-105 transition-transform duration-300"
                  src="/images/anime2.jpg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GitHub Section - محسن */}
      <section id="github" className="py-20 relative z-10">
        <div className="mx-auto w-full px-4 lg:px-6 xl:max-w-7xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-gray-400 mb-6 border border-white/10">
              <Github className="w-4 h-4" />
              <span>مفتوح المصدر</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">مشاريعنا مفتوحة المصدر</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              نؤمن بقوة المجتمع المفتوح. تصفح مشاريعنا وساهم في تطوير المجتمع التقني العربي
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-red-500/50 transition-all duration-300">
                  <CardContent className="p-6">
                    <Github className="w-8 h-8 text-red-400 mb-4" />
                    <h3 className="font-semibold text-white mb-2">المشاريع النشطة</h3>
                    <p className="text-2xl font-bold text-red-400">15+</p>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-red-500/50 transition-all duration-300">
                  <CardContent className="p-6">
                    <Star className="w-8 h-8 text-yellow-400 mb-4" />
                    <h3 className="font-semibold text-white mb-2">النجوم</h3>
                    <p className="text-2xl font-bold text-yellow-400">1.2K+</p>
                  </CardContent>
                </Card>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  className="bg-gradient-to-r from-red-600 to-orange-500 text-white hover:from-red-700 hover:to-orange-600 transition-all duration-300 rounded-full px-6 py-3 font-medium flex-1"
                  asChild
                >
                  <Link href="https://github.com/drx3">
                    <Github className="size-4 ml-2" />
                    زيارة GitHub
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 rounded-full px-6 py-3 transition-all duration-300 bg-transparent backdrop-blur-sm flex-1"
                  asChild
                >
                  <Link href="https://github.com/drx3/projects">
                    <ExternalLink className="size-4 ml-2" />
                    المشاريع
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="relative group">
                <img
                  alt="مشاريع GitHub"
                  loading="lazy"
                  width="400"
                  height="400"
                  className="w-full rounded-2xl shadow-2xl group-hover:scale-105 transition-transform duration-300"
                  src="/images/anime3.jpg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="text-white font-semibold">مشاريع مفتوحة المصدر</div>
                    <div className="text-gray-300 text-sm">ساهم في تطوير المجتمع التقني</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - محسن */}
      <footer className="relative w-full overflow-hidden border-t border-white/10 bg-black/50 backdrop-blur-sm">
        <div className="py-16">
          <div className="mx-auto w-full px-4 lg:px-6 xl:max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              <div className="space-y-4">
                <div className="text-2xl font-bold gradient-text">drx3</div>
                <p className="text-gray-400 text-sm">منصة الذكاء الاصطناعي المتقدمة التي تقدم حلولاً مبتكرة للجميع</p>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-white">الخدمات</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>
                    <Link href="/chat" className="hover:text-white transition-colors">
                      المحادثة الذكية
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white transition-colors">
                      تحليل البيانات
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white transition-colors">
                      الحلول المؤسسية
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-white">الشركة</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>
                    <Link href="#about" className="hover:text-white transition-colors">
                      من نحن
                    </Link>
                  </li>
                  <li>
                    <Link href="#contact" className="hover:text-white transition-colors">
                      تواصل معنا
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white transition-colors">
                      الوظائف
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-white">المطورون</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>
                    <Link href="#github" className="hover:text-white transition-colors">
                      GitHub
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white transition-colors">
                      API
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white transition-colors">
                      الوثائق
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-white/10 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-500">© 2024 drx3. جميع الحقوق محفوظة.</div>
                <div className="flex gap-6">
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    سياسة الخصوصية
                  </Link>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    شروط الاستخدام
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
