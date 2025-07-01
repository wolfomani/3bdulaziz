"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import {
  ExternalLink,
  Github,
  Mail,
  ArrowDown,
  Brain,
  Rocket,
  MessageSquare,
  Users,
  Star,
  Code,
  Database,
  Cpu,
  Globe,
  BookOpen,
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
      {/* Skip to content for accessibility */}
      <a href="#main-content" className="skip-to-content">
        انتقل إلى المحتوى الرئيسي
      </a>

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
            <Link href="/" aria-label="عبد العزيز الحمداني - الصفحة الرئيسية" className="z-50">
              <div className="text-2xl font-bold gradient-text hover:scale-105 transition-transform">
                عبد العزيز الحمداني
              </div>
            </Link>

            <ul className="ml-3 hidden flex-grow gap-6 lg:flex">
              <li>
                <Link
                  className="text-red-400 font-medium px-3 py-2 text-sm hover:text-red-300 hover:bg-white/5 rounded-lg transition-all duration-200"
                  href="#skills"
                >
                  المهارات
                </Link>
              </li>
              <li>
                <Link
                  className="text-white/70 font-medium px-3 py-2 text-sm hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
                  href="#projects"
                >
                  المشاريع
                </Link>
              </li>
              <li>
                <Link
                  className="text-white/70 font-medium px-3 py-2 text-sm hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
                  href="#about"
                >
                  من أنا
                </Link>
              </li>
              <li>
                <Link
                  className="text-white/70 font-medium px-3 py-2 text-sm hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
                  href="#contact"
                >
                  تواصل معي
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

      {/* Hero Section - محسن مع الصورة الشخصية */}
      <section id="main-content" className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0" style={{ transform: `translateY(${scrollY * 0.5}px)` }}>
          <div className="absolute -inset-x-0 bottom-28 lg:bottom-12 flex justify-center">
            <div className="max-w-7xl w-full flex justify-center items-center">
              <div className="opacity-5 lg:opacity-10 select-none text-[15rem] lg:text-[20rem] font-bold tracking-wider text-white/20 animate-pulse">
                عبد العزيز
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full px-4 lg:px-6 xl:max-w-7xl flex h-full flex-col relative z-10">
          <div className="flex items-center justify-center h-full mt-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl w-full">
              {/* النص والمحتوى */}
              <div className="text-center lg:text-right space-y-8 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-white/80 border border-white/20 mb-6">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span>مهندس برمجيات من سلطنة عُمان</span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                  <span className="gradient-text animate-float">عبد العزيز الحمداني</span>
                  <br />
                  <span className="text-white text-2xl md:text-3xl lg:text-4xl">خبير الذكاء الاصطناعي</span>
                </h1>

                <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed animate-slide-in-right">
                  مهندس برمجيات متخصص في Python والذكاء الاصطناعي، أطور حلول RAG المتقدمة وأعمل مع Groq API لإنشاء
                  تطبيقات ذكية عالية الأداء
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-in-left pt-4">
                  <Link href="/chat">
                    <Button className="bg-gradient-to-r from-red-600 to-orange-500 text-white hover:from-red-700 hover:to-orange-600 transition-all duration-300 rounded-full px-8 py-4 text-lg font-medium shadow-xl hover:shadow-red-500/30 hover:scale-105 group">
                      <MessageSquare className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
                      تحدث معي
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 rounded-full px-8 py-4 text-lg font-medium bg-transparent backdrop-blur-sm group"
                    asChild
                  >
                    <Link href="#projects">
                      <Code className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                      شاهد أعمالي
                    </Link>
                  </Button>
                </div>

                {/* روابط التواصل */}
                <div className="flex gap-4 justify-center lg:justify-start pt-6">
                  <Link
                    href="https://github.com/wolfomani"
                    className="bg-white/10 backdrop-blur-sm rounded-full p-3 hover:bg-white/20 transition-all duration-300 group"
                    aria-label="GitHub Profile"
                  >
                    <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </Link>
                  <Link
                    href="https://t.me/wolfaiOM"
                    className="bg-white/10 backdrop-blur-sm rounded-full p-3 hover:bg-white/20 transition-all duration-300 group"
                    aria-label="Telegram"
                  >
                    <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </Link>
                  <Link
                    href="mailto:openaziz00@gmail.com"
                    className="bg-white/10 backdrop-blur-sm rounded-full p-3 hover:bg-white/20 transition-all duration-300 group"
                    aria-label="Email"
                  >
                    <Mail className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* الصورة الشخصية */}
              <div className="flex justify-center lg:justify-end">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-red-600 to-orange-500 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                  <div className="relative">
                    <img
                      src="/images/profile-photo.jpg"
                      alt="عبد العزيز الحمداني - مهندس برمجيات متخصص في الذكاء الاصطناعي"
                      className="w-80 h-80 md:w-96 md:h-96 rounded-full object-cover border-4 border-white/20 shadow-2xl group-hover:scale-105 transition-all duration-300 profile-image"
                      loading="eager"
                    />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 to-transparent"></div>

                    {/* شارة الحالة */}
                    <div className="absolute bottom-8 right-8 bg-green-500 w-6 h-6 rounded-full border-4 border-white shadow-lg animate-pulse"></div>

                    {/* معلومات إضافية */}
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                      <div className="text-center">
                        <div className="text-sm font-medium text-white">متاح للعمل</div>
                        <div className="text-xs text-gray-300">سلطنة عُمان</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ArrowDown className="w-6 h-6 text-white/60" />
        </div>
      </section>

      {/* Skills Section - جديد */}
      <section id="skills" className="py-20 relative z-10">
        <div className="mx-auto w-full px-4 lg:px-6 xl:max-w-7xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-gray-400 mb-6 border border-white/10">
              <Code className="w-4 h-4" />
              <span>المهارات التقنية</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">خبراتي التقنية</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              متخصص في تطوير حلول الذكاء الاصطناعي المتقدمة باستخدام أحدث التقنيات
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-red-500/50 transition-all duration-300 group hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="bg-gradient-to-r from-red-600 to-orange-500 w-16 h-16 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <Code className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">Python</h3>
                <p className="text-gray-400 text-sm mb-4">تطوير التطبيقات والذكاء الاصطناعي</p>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-red-600 to-orange-500 h-2 rounded-full w-[95%]"></div>
                </div>
                <span className="text-xs text-gray-400 mt-2 block">95%</span>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-red-500/50 transition-all duration-300 group hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="bg-gradient-to-r from-red-600 to-orange-500 w-16 h-16 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">RAG Systems</h3>
                <p className="text-gray-400 text-sm mb-4">أنظمة الاسترجاع المعززة</p>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-red-600 to-orange-500 h-2 rounded-full w-[90%]"></div>
                </div>
                <span className="text-xs text-gray-400 mt-2 block">90%</span>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-red-500/50 transition-all duration-300 group hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="bg-gradient-to-r from-red-600 to-orange-500 w-16 h-16 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <Cpu className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">Groq API</h3>
                <p className="text-gray-400 text-sm mb-4">تكامل وتحسين APIs</p>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-red-600 to-orange-500 h-2 rounded-full w-[85%]"></div>
                </div>
                <span className="text-xs text-gray-400 mt-2 block">85%</span>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-red-500/50 transition-all duration-300 group hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="bg-gradient-to-r from-red-600 to-orange-500 w-16 h-16 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <Database className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">Vector DBs</h3>
                <p className="text-gray-400 text-sm mb-4">قواعد البيانات المتجهة</p>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-red-600 to-orange-500 h-2 rounded-full w-[88%]"></div>
                </div>
                <span className="text-xs text-gray-400 mt-2 block">88%</span>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Projects Section - محسن */}
      <section id="projects" className="py-20 relative z-10">
        <div className="mx-auto w-full px-4 lg:px-6 xl:max-w-7xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-gray-400 mb-6 border border-white/10">
              <Rocket className="w-4 h-4" />
              <span>المشاريع</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">مشاريعي المبتكرة</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              مجموعة من المشاريع التي تجمع بين الذكاء الاصطناعي والحلول العملية
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-red-500/50 transition-all duration-300 group hover:scale-105">
              <CardContent className="p-6">
                <div className="bg-gradient-to-r from-red-600 to-orange-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">منصة تعليمية تفاعلية</h3>
                <p className="text-gray-400 mb-4">
                  منصة تستخدم الذكاء الاصطناعي لتخصيص تجربة التعلم حسب احتياجات الطالب مع خوارزميات متقدمة لتتبع التقدم
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded-full text-xs">Python</span>
                  <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-xs">RAG</span>
                  <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded-full text-xs">ML</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 bg-transparent"
                  >
                    <Github className="w-4 h-4 ml-1" />
                    الكود
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 bg-transparent"
                  >
                    <ExternalLink className="w-4 h-4 ml-1" />
                    عرض
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-red-500/50 transition-all duration-300 group hover:scale-105">
              <CardContent className="p-6">
                <div className="bg-gradient-to-r from-red-600 to-orange-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">نظام قاعدة البيانات المتجهة</h3>
                <p className="text-gray-400 mb-4">
                  نظام متقدم لإدارة البيانات المتجهة مع تحسينات للبحث الدلالي والاسترجاع السريع، مُحسَّن للتطبيقات العربية
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded-full text-xs">Vector DB</span>
                  <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full text-xs">Embeddings</span>
                  <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full text-xs">Arabic NLP</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 bg-transparent"
                  >
                    <Github className="w-4 h-4 ml-1" />
                    الكود
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 bg-transparent"
                  >
                    <ExternalLink className="w-4 h-4 ml-1" />
                    عرض
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-red-500/50 transition-all duration-300 group hover:scale-105">
              <CardContent className="p-6">
                <div className="bg-gradient-to-r from-red-600 to-orange-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">مساعد ذكي متعدد اللغات</h3>
                <p className="text-gray-400 mb-4">
                  مساعد ذكي يدعم العربية والإنجليزية مع قدرات متقدمة في فهم السياق والرد بطريقة طبيعية
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded-full text-xs">Groq API</span>
                  <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-xs">NLP</span>
                  <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded-full text-xs">Multilingual</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 bg-transparent"
                  >
                    <Github className="w-4 h-4 ml-1" />
                    الكود
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 bg-transparent"
                  >
                    <ExternalLink className="w-4 h-4 ml-1" />
                    تجربة
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* GitHub Stats */}
          <div className="mt-16 text-center">
            <Card className="bg-gradient-to-r from-red-600/20 to-orange-500/20 backdrop-blur-sm border-red-500/30 max-w-2xl mx-auto">
              <CardContent className="p-8">
                <div className="grid grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-400 mb-2">15+</div>
                    <div className="text-sm text-gray-400">مشروع نشط</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-400 mb-2">1.2K+</div>
                    <div className="text-sm text-gray-400">نجمة GitHub</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400 mb-2">500+</div>
                    <div className="text-sm text-gray-400">مساهمة</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section - محسن مع المعلومات الشخصية */}
      <section id="about" className="py-20 relative z-10">
        <div className="mx-auto w-full px-4 lg:px-6 xl:max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-gray-400 border border-white/10">
                <Users className="w-4 h-4" />
                <span>من أنا</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                عبد العزيز الحمداني
                <br />
                <span className="text-2xl md:text-3xl text-red-400">مهندس برمجيات من عُمان</span>
              </h2>

              <div className="space-y-6">
                <p className="text-lg text-gray-300 leading-relaxed">
                  أنا عبد العزيز الحمداني من سلطنة عُمان، مهندس برمجيات متخصص في تطوير حلول الذكاء الاصطناعي المتقدمة.
                  أركز على تطوير أنظمة RAG والتكامل مع Groq API لإنشاء تطبيقات ذكية عالية الأداء.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <Code className="w-5 h-5 text-red-400" />
                      <span className="font-semibold text-white">التخصص الرئيسي</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      تطوير التطبيقات بـ Python مع التركيز على مكتبات الذكاء الاصطناعي
                    </p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <Brain className="w-5 h-5 text-red-400" />
                      <span className="font-semibold text-white">أنظمة RAG</span>
                    </div>
                    <p className="text-gray-400 text-sm">تطوير حلول Retrieval-Augmented Generation للتطبيقات الذكية</p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <Cpu className="w-5 h-5 text-red-400" />
                      <span className="font-semibold text-white">تكامل APIs</span>
                    </div>
                    <p className="text-gray-400 text-sm">خبرة في استخدام وتحسين Groq API وواجهات الذكاء الاصطناعي</p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <Globe className="w-5 h-5 text-red-400" />
                      <span className="font-semibold text-white">الحلول المبتكرة</span>
                    </div>
                    <p className="text-gray-400 text-sm">تطوير حلول تجمع بين التقنيات الحديثة والاحتياجات العملية</p>
                  </div>
                </div>

                <p className="text-lg text-gray-300 leading-relaxed">
                  هدفي هو إنشاء منتجات تساعد الناس وتجعل حياتهم أسهل وأكثر إنتاجية. أؤمن بأن الذكاء الاصطناعي يجب أن
                  يكون في متناول الجميع، وأعمل على تطوير حلول تدعم اللغة العربية وتخدم المجتمع العربي.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  className="bg-gradient-to-r from-red-600 to-orange-500 text-white hover:from-red-700 hover:to-orange-600 transition-all duration-300 rounded-full px-6 py-3 font-medium"
                  asChild
                >
                  <Link href="#contact">
                    <Mail className="size-4 ml-2" />
                    تواصل معي
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 rounded-full px-6 py-3 transition-all duration-300 bg-transparent backdrop-blur-sm"
                  asChild
                >
                  <Link href="https://github.com/wolfomani">
                    <Github className="size-4 ml-2" />
                    GitHub Profile
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="relative group">
                <img
                  alt="عبد العزيز الحمداني في بيئة العمل"
                  loading="lazy"
                  width="500"
                  height="500"
                  className="w-full rounded-2xl shadow-2xl group-hover:scale-105 transition-transform duration-300"
                  src="/images/anime1.jpg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="text-white font-semibold">مطور من سلطنة عُمان</div>
                    <div className="text-gray-300 text-sm">متخصص في الذكاء الاصطناعي والبرمجة</div>
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
              <Mail className="w-4 h-4" />
              <span>تواصل معي</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">دعنا نتعاون</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              هل لديك مشروع مثير أو فكرة تريد تطويرها؟ أنا متاح للتعاون في مشاريع الذكاء الاصطناعي المبتكرة
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-6">
                <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-red-500/50 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-to-r from-red-600 to-orange-500 w-12 h-12 rounded-lg flex items-center justify-center">
                        <Mail className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white mb-1">البريد الإلكتروني</h3>
                        <p className="text-gray-400">openaziz00@gmail.com</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-red-500/50 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-to-r from-red-600 to-orange-500 w-12 h-12 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white mb-1">Telegram</h3>
                        <p className="text-gray-400">@wolfaiOM</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-red-500/50 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-to-r from-red-600 to-orange-500 w-12 h-12 rounded-lg flex items-center justify-center">
                        <Github className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white mb-1">GitHub</h3>
                        <p className="text-gray-400">wolfomani</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  className="bg-gradient-to-r from-red-600 to-orange-500 text-white hover:from-red-700 hover:to-orange-600 transition-all duration-300 rounded-full px-6 py-3 font-medium flex-1"
                  asChild
                >
                  <Link href="mailto:openaziz00@gmail.com">
                    <Mail className="size-4 ml-2" />
                    راسلني الآن
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 rounded-full px-6 py-3 transition-all duration-300 bg-transparent backdrop-blur-sm flex-1"
                  asChild
                >
                  <Link href="https://t.me/wolfaiOM">
                    <MessageSquare className="size-4 ml-2" />
                    Telegram
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="relative group">
                <img
                  alt="تواصل مع عبد العزيز الحمداني"
                  loading="lazy"
                  width="400"
                  height="400"
                  className="w-full rounded-2xl shadow-2xl group-hover:scale-105 transition-transform duration-300"
                  src="/images/anime2.jpg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="text-white font-semibold">متاح للتعاون</div>
                    <div className="text-gray-300 text-sm">مشاريع الذكاء الاصطناعي والتطوير</div>
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
                <div className="text-2xl font-bold gradient-text">عبد العزيز الحمداني</div>
                <p className="text-gray-400 text-sm">
                  مهندس برمجيات متخصص في الذكاء الاصطناعي من سلطنة عُمان. أطور حلول RAG المتقدمة وأعمل مع Groq API
                </p>
                <div className="flex gap-3">
                  <Link
                    href="https://github.com/wolfomani"
                    className="bg-white/10 backdrop-blur-sm rounded-full p-2 hover:bg-white/20 transition-all duration-300"
                    aria-label="GitHub"
                  >
                    <Github className="w-4 h-4" />
                  </Link>
                  <Link
                    href="https://t.me/wolfaiOM"
                    className="bg-white/10 backdrop-blur-sm rounded-full p-2 hover:bg-white/20 transition-all duration-300"
                    aria-label="Telegram"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Link>
                  <Link
                    href="mailto:openaziz00@gmail.com"
                    className="bg-white/10 backdrop-blur-sm rounded-full p-2 hover:bg-white/20 transition-all duration-300"
                    aria-label="Email"
                  >
                    <Mail className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-white">المهارات</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>
                    <Link href="#skills" className="hover:text-white transition-colors">
                      Python Development
                    </Link>
                  </li>
                  <li>
                    <Link href="#skills" className="hover:text-white transition-colors">
                      RAG Systems
                    </Link>
                  </li>
                  <li>
                    <Link href="#skills" className="hover:text-white transition-colors">
                      Groq API
                    </Link>
                  </li>
                  <li>
                    <Link href="#skills" className="hover:text-white transition-colors">
                      Vector Databases
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-white">المشاريع</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>
                    <Link href="#projects" className="hover:text-white transition-colors">
                      منصة تعليمية تفاعلية
                    </Link>
                  </li>
                  <li>
                    <Link href="#projects" className="hover:text-white transition-colors">
                      قاعدة البيانات المتجهة
                    </Link>
                  </li>
                  <li>
                    <Link href="#projects" className="hover:text-white transition-colors">
                      مساعد ذكي متعدد اللغات
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-white">التواصل</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>
                    <Link href="#contact" className="hover:text-white transition-colors">
                      تواصل معي
                    </Link>
                  </li>
                  <li>
                    <Link href="/chat" className="hover:text-white transition-colors">
                      المحادثة الذكية
                    </Link>
                  </li>
                  <li>
                    <Link href="#about" className="hover:text-white transition-colors">
                      من أنا
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-white/10 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-500">© 2024 عبد العزيز الحمداني. جميع الحقوق محفوظة.</div>
                <div className="flex gap-6">
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    سياسة الخصوصية
                  </Link>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
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
