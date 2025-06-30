"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ExternalLink, Github, Mail, ArrowDown, Zap, Brain, Shield, Rocket } from "lucide-react"
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
      </div>

      {/* Header */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrollY > 50 ? "bg-black/90 backdrop-blur-md py-2" : "py-4"
        }`}
      >
        <div className="mx-auto w-full px-4 lg:px-6 xl:max-w-7xl relative">
          <nav className="flex items-center justify-between gap-4">
            <Link href="/" aria-label="drx3 Homepage" className="z-50">
              <div className="text-2xl font-bold gradient-text">drx3</div>
            </Link>

            <ul className="ml-3 hidden flex-grow gap-4 lg:flex">
              <li>
                <Link
                  className="text-red-400 font-mono uppercase px-3 py-1.5 text-sm hover:text-red-300 transition-colors"
                  href="#features"
                >
                  المميزات
                </Link>
              </li>
              <li>
                <Link
                  className="text-white/70 font-mono uppercase px-3 py-1.5 text-sm hover:text-white transition-colors"
                  href="#about"
                >
                  من نحن
                </Link>
              </li>
              <li>
                <Link
                  className="text-white/70 font-mono uppercase px-3 py-1.5 text-sm hover:text-white transition-colors"
                  href="#contact"
                >
                  تواصل
                </Link>
              </li>
              <li>
                <Link
                  className="text-white/70 font-mono uppercase px-3 py-1.5 text-sm hover:text-white transition-colors"
                  href="#github"
                >
                  جيت هب
                </Link>
              </li>
            </ul>

            <div className="flex gap-2">
              <Link href="/chat">
                <Button className="bg-gradient-to-r from-red-600 to-orange-500 text-white hover:opacity-90 transition-opacity rounded-full px-6">
                  ابدأ المحادثة
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative h-screen w-full flex items-center justify-center overflow-hidden">
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
            <div className="text-center space-y-8 animate-fade-in-up">
              <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold tracking-tight gradient-text animate-float">
                drx3
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto animate-slide-in-right">
                منصة الذكاء الاصطناعي المتقدمة التي تقدم حلولاً مبتكرة
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-in-left">
                <Link href="/chat">
                  <Button className="bg-gradient-to-r from-red-600 to-orange-500 text-white hover:opacity-90 transition-all duration-300 rounded-full px-8 py-3 text-lg animate-glow">
                    ابدأ الآن
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="border-white/25 text-white hover:bg-white/10 rounded-full px-8 py-3 text-lg bg-transparent"
                >
                  اكتشف المزيد
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ArrowDown className="w-6 h-6 text-white/60" />
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-32 relative z-10">
        <div className="mx-auto w-full px-4 lg:px-6 xl:max-w-7xl">
          <div className="text-center mb-16">
            <div className="font-mono flex items-center justify-center gap-2 text-sm text-gray-400 mb-4">
              <span>[</span> <span>المميزات</span> <span>]</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
              قوة الذكاء الاصطناعي في خدمتك
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-red-500/50 transition-all duration-300 group">
              <div className="bg-gradient-to-r from-red-600 to-orange-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">سرعة فائقة</h3>
              <p className="text-gray-400">استجابة فورية وأداء متميز في جميع المهام</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-red-500/50 transition-all duration-300 group">
              <div className="bg-gradient-to-r from-red-600 to-orange-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">ذكاء متقدم</h3>
              <p className="text-gray-400">تقنيات الذكاء الاصطناعي الأحدث والأكثر تطوراً</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-red-500/50 transition-all duration-300 group">
              <div className="bg-gradient-to-r from-red-600 to-orange-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">أمان عالي</h3>
              <p className="text-gray-400">حماية متقدمة لبياناتك وخصوصيتك</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-red-500/50 transition-all duration-300 group">
              <div className="bg-gradient-to-r from-red-600 to-orange-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">تطوير مستمر</h3>
              <p className="text-gray-400">تحديثات دورية وميزات جديدة باستمرار</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 sm:py-32 relative z-10">
        <div className="mx-auto w-full px-4 lg:px-6 xl:max-w-7xl space-y-16 sm:space-y-32">
          <div className="text-center space-y-12">
            <div className="font-mono flex items-center justify-center gap-2 text-sm text-gray-400">
              <span>[</span> <span>من نحن</span> <span>]</span>
            </div>
            <h2 className="text-balance text-3xl md:text-4xl lg:text-5xl tracking-tight font-bold">
              نحن فريق من المطورين والمبدعين
            </h2>
            <div className="max-w-4xl mx-auto">
              <div className="relative mb-8 group">
                <img
                  alt="فريق التطوير"
                  loading="lazy"
                  width="400"
                  height="400"
                  className="w-full max-w-md mx-auto rounded-xl shadow-2xl group-hover:scale-105 transition-transform duration-300"
                  src="/images/anime1.jpg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl" />
              </div>
              <p className="text-lg text-gray-300 leading-relaxed">
                نحن مجموعة من المطورين المتحمسين الذين يؤمنون بقوة التكنولوجيا في تغيير العالم. نعمل على تطوير حلول
                مبتكرة باستخدام أحدث تقنيات الذكاء الاصطناعي والبرمجة. هدفنا هو إنشاء منتجات تساعد الناس وتجعل حياتهم
                أسهل وأكثر إنتاجية.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 sm:py-32 relative z-10">
        <div className="mx-auto w-full px-4 lg:px-6 xl:max-w-7xl space-y-16 sm:space-y-32">
          <div className="text-center space-y-12">
            <div className="font-mono flex items-center justify-center gap-2 text-sm text-gray-400">
              <span>[</span> <span>تواصل معنا</span> <span>]</span>
            </div>
            <h2 className="text-balance text-3xl md:text-4xl lg:text-5xl tracking-tight font-bold">نحن هنا للمساعدة</h2>
            <div className="max-w-2xl mx-auto">
              <div className="relative mb-8 group">
                <img
                  alt="تواصل معنا"
                  loading="lazy"
                  width="300"
                  height="300"
                  className="w-full max-w-sm mx-auto rounded-xl shadow-2xl group-hover:scale-105 transition-transform duration-300"
                  src="/images/anime2.jpg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl" />
              </div>
              <p className="text-lg text-gray-300 mb-8">لديك سؤال أو تريد التعاون معنا؟ لا تتردد في التواصل معنا</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="outline"
                  className="border-white/25 text-white hover:bg-white/10 rounded-full px-6 py-3 transition-all duration-300 bg-transparent"
                  asChild
                >
                  <Link href="mailto:contact@drx3.com">
                    <Mail className="size-4 ml-2" />
                    البريد الإلكتروني
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="border-white/25 text-white hover:bg-white/10 rounded-full px-6 py-3 transition-all duration-300 bg-transparent"
                  asChild
                >
                  <Link href="https://twitter.com/drx3">
                    <ExternalLink className="size-4 ml-2" />
                    تويتر
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GitHub Section */}
      <section id="github" className="py-16 sm:py-32 relative z-10">
        <div className="mx-auto w-full px-4 lg:px-6 xl:max-w-7xl space-y-16 sm:space-y-32">
          <div className="text-center space-y-12">
            <div className="font-mono flex items-center justify-center gap-2 text-sm text-gray-400">
              <span>[</span> <span>جيت هب</span> <span>]</span>
            </div>
            <h2 className="text-balance text-3xl md:text-4xl lg:text-5xl tracking-tight font-bold">
              مشاريعنا مفتوحة المصدر
            </h2>
            <div className="max-w-2xl mx-auto">
              <div className="relative mb-8 group">
                <img
                  alt="مشاريع جيت هب"
                  loading="lazy"
                  width="300"
                  height="300"
                  className="w-full max-w-sm mx-auto rounded-xl shadow-2xl group-hover:scale-105 transition-transform duration-300"
                  src="/images/anime3.jpg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl" />
              </div>
              <p className="text-lg text-gray-300 mb-8">تصفح مشاريعنا على جيت هب وساهم في تطوير المجتمع التقني</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="outline"
                  className="border-white/25 text-white hover:bg-white/10 rounded-full px-6 py-3 transition-all duration-300 bg-transparent"
                  asChild
                >
                  <Link href="https://github.com/drx3">
                    <Github className="size-4 ml-2" />
                    زيارة جيت هب
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="border-white/25 text-white hover:bg-white/10 rounded-full px-6 py-3 transition-all duration-300 bg-transparent"
                  asChild
                >
                  <Link href="https://github.com/drx3/projects">
                    <ExternalLink className="size-4 ml-2" />
                    المشاريع
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative w-full overflow-hidden border-t border-white/10 pb-32 md:pb-16 bg-black/50 backdrop-blur-sm">
        <section className="py-16">
          <div className="mx-auto w-full px-4 lg:px-6 xl:max-w-7xl">
            <div className="text-center space-y-8">
              <div className="flex justify-center gap-8 flex-wrap">
                <Link href="#features" className="text-gray-400 hover:text-white transition-colors">
                  المميزات
                </Link>
                <Link href="#about" className="text-gray-400 hover:text-white transition-colors">
                  من نحن
                </Link>
                <Link href="#contact" className="text-gray-400 hover:text-white transition-colors">
                  تواصل
                </Link>
                <Link href="#github" className="text-gray-400 hover:text-white transition-colors">
                  جيت هب
                </Link>
              </div>
              <div className="text-sm text-gray-500">© 2024 drx3. جميع الحقوق محفوظة.</div>
            </div>
          </div>
        </section>
      </footer>
    </div>
  )
}
