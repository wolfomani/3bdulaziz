"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { FireParticles } from "@/components/fire-particles"
import {
  Calendar,
  User,
  Eye,
  Heart,
  Share2,
  Clock,
  ArrowLeft,
  Code,
  Cpu,
  Zap,
  BookOpen,
  Flame,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"

interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  author: string
  published_date: string
  category: string
  tags: string[]
  views: number
  likes: number
  reading_time: number
  image_url?: string
}

// GitHub Copilot article content in Arabic
const GITHUB_COPILOT_CONTENT = `
# دليل شامل لـ GitHub Copilot: مساعد البرمجة الذكي

## مقدمة

GitHub Copilot هو مساعد برمجة ذكي يعتمد على الذكاء الاصطناعي، تم تطويره من قبل GitHub بالتعاون مع OpenAI. يستخدم Copilot نموذج Codex المبني على GPT-3 لتقديم اقتراحات كود ذكية ومفيدة أثناء البرمجة.

## ما هو GitHub Copilot؟

GitHub Copilot هو أداة تعمل كمساعد شخصي للمطورين، حيث يقوم بـ:

- **اقتراح الكود**: يقترح أسطر كود كاملة أو دوال بناءً على السياق
- **إكمال الكود**: يكمل الكود الذي بدأت في كتابته
- **شرح الكود**: يساعد في فهم وشرح أجزاء معقدة من الكود
- **إنشاء اختبارات**: يقترح اختبارات للدوال والكلاسات

## كيف يعمل GitHub Copilot؟

### التقنية وراء Copilot

يعتمد GitHub Copilot على:

1. **نموذج Codex**: نموذج ذكاء اصطناعي مدرب على مليارات الأسطر من الكود المفتوح المصدر
2. **معالجة اللغة الطبيعية**: فهم التعليقات والأوصاف المكتوبة بلغة طبيعية
3. **تحليل السياق**: فهم سياق الكود المحيط لتقديم اقتراحات دقيقة

### آلية العمل

1. تحليل الكود الحالي والسياق
2. إرسال البيانات إلى خوادم GitHub
3. معالجة البيانات باستخدام نموذج Codex
4. إرجاع اقتراحات الكود
5. عرض الاقتراحات في محرر النصوص

## التثبيت والإعداد

### متطلبات النظام

- **محرر نصوص مدعوم**: Visual Studio Code, JetBrains IDEs, Neovim
- **اشتراك GitHub Copilot**: مدفوع أو تجريبي
- **اتصال بالإنترنت**: مطلوب للتواصل مع خوادم GitHub

### خطوات التثبيت

#### في Visual Studio Code:

1. **تثبيت الإضافة**:
   \`\`\`bash
   # من خلال سطر الأوامر
   code --install-extension GitHub.copilot
   \`\`\`

2. **تسجيل الدخول**:
   - افتح VS Code
   - اضغط على Ctrl+Shift+P
   - اكتب "GitHub Copilot: Sign In"
   - اتبع التعليمات لتسجيل الدخول

3. **التفعيل**:
   \`\`\`json
   // في settings.json
   {
     "github.copilot.enable": {
       "*": true,
       "yaml": false,
       "plaintext": false
     }
   }
   \`\`\`

#### في JetBrains IDEs:

1. **تثبيت البرنامج المساعد**:
   - File → Settings → Plugins
   - ابحث عن "GitHub Copilot"
   - اضغط Install

2. **التكوين**:
   - File → Settings → Tools → GitHub Copilot
   - قم بتسجيل الدخول وتفعيل الخدمة

## الاستخدام العملي

### الاقتراحات التلقائية

عندما تبدأ في كتابة كود، سيقوم Copilot بعرض اقتراحات:

\`\`\`javascript
// مثال: كتابة دالة لحساب المضروب
function factorial(n) {
  // Copilot سيقترح:
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}
\`\`\`

### استخدام التعليقات

يمكن استخدام التعليقات لتوجيه Copilot:

\`\`\`python
# دالة لفرز قائمة من الأرقام باستخدام خوارزمية الفقاعة
def bubble_sort(arr):
    # Copilot سيقترح تنفيذ خوارزمية الفرز
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr
\`\`\`

### إنشاء اختبارات

\`\`\`javascript
// دالة لجمع رقمين
function add(a, b) {
  return a + b;
}

// اختبار الدالة
// Copilot سيقترح:
test('should add two numbers correctly', () => {
  expect(add(2, 3)).toBe(5);
  expect(add(-1, 1)).toBe(0);
  expect(add(0, 0)).toBe(0);
});
\`\`\`

## المزايا والعيوب

### المزايا:
- تسريع عملية البرمجة
- تقليل الأخطاء الشائعة
- تعلم أنماط برمجة جديدة
- دعم لغات برمجة متعددة

### العيوب:
- قد يقترح كود غير آمن
- الاعتماد المفرط على الأداة
- مشاكل الخصوصية والملكية الفكرية
- التكلفة الشهرية

## الخلاصة

GitHub Copilot أداة قوية يمكنها تحسين إنتاجية المطورين بشكل كبير، لكن يجب استخدامها بحكمة ومراجعة الكود المقترح دائماً.
`

// Mock blog post data for GitHub Copilot article
const mockBlogPost: BlogPost = {
  id: "github-copilot-guide",
  title: "دليل شامل لـ GitHub Copilot: مساعد البرمجة الذكي",
  slug: "github-copilot-guide",
  content: GITHUB_COPILOT_CONTENT,
  author: "Dr. Ahmed Al-Rashid",
  published_date: "2024-01-15",
  category: "AI Tools",
  tags: ["GitHub", "AI", "Programming", "Copilot", "Development"],
  views: 1250,
  likes: 89,
  reading_time: 12,
  image_url: "/placeholder.svg?height=400&width=800",
}

export default function BlogPostPage() {
  const { slug } = useParams()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Simulate fetching blog post data
    const fetchPost = async () => {
      try {
        setLoading(true)
        // For now, we'll use mock data
        // In a real app, you would fetch from your API
        await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate loading
        setPost(mockBlogPost)
      } catch (error) {
        console.error("Error fetching blog post:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [slug])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.title,
          url: window.location.href,
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      handleCopy()
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
        <p className="mt-4 text-lg">جاري التحميل...</p>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">المقال غير موجود</h1>
        <Link href="/blog" className="flex items-center gap-2 text-orange-500 hover:text-orange-600">
          <ArrowLeft className="w-4 h-4" />
          العودة إلى المدونة
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="bg-black/40 backdrop-blur-sm border-orange-500/20 text-white">
          <CardContent className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <Link
                href="/blog"
                className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                العودة إلى المدونة
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 bg-transparent"
              >
                <Share2 className="w-4 h-4 mr-2" />
                مشاركة
              </Button>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              {post.title}
            </h1>

            <Separator className="my-6 bg-orange-500/20" />

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 mb-6 text-gray-300">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-orange-400" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-400" />
                <span>{post.published_date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400" />
                <span>{post.reading_time} دقائق قراءة</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-orange-400" />
                <span>{post.views.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-orange-400" />
                <span>{post.likes}</span>
              </div>
            </div>

            {/* Tags and Category */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">{post.category}</Badge>
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700/50">
                  {tag}
                </Badge>
              ))}
            </div>

            <Separator className="my-6 bg-orange-500/20" />

            {/* Featured Image */}
            {post.image_url && (
              <div className="mb-8">
                <img
                  src={post.image_url || "/placeholder.svg"}
                  alt={post.title}
                  className="w-full h-64 object-cover rounded-lg border border-orange-500/20"
                />
              </div>
            )}

            {/* Content */}
            <div className="prose prose-invert prose-orange max-w-none mb-8">
              <div
                className="text-gray-200 leading-relaxed whitespace-pre-line"
                style={{ direction: "rtl", textAlign: "right" }}
              >
                {post.content}
              </div>
            </div>

            <Separator className="my-8 bg-orange-500/20" />

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <Button
                variant="outline"
                className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 bg-transparent"
              >
                <Code className="w-4 h-4 mr-2" />
                عرض الكود
              </Button>
              <Button
                variant="outline"
                className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 bg-transparent"
              >
                <Cpu className="w-4 h-4 mr-2" />
                الأداء
              </Button>
              <Button
                variant="outline"
                className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 bg-transparent"
              >
                <Zap className="w-4 h-4 mr-2" />
                سريع
              </Button>
              <Button
                variant="outline"
                className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 bg-transparent"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                قراءة المزيد
              </Button>
              <Button
                variant="outline"
                className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 bg-transparent"
              >
                <Flame className="w-4 h-4 mr-2" />
                مميز
              </Button>
              <Button
                variant="outline"
                onClick={handleCopy}
                className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 bg-transparent"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    تم النسخ
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    نسخ الرابط
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 bg-transparent"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                رابط خارجي
              </Button>
            </div>

            {/* Fire Particles Effect */}
            <FireParticles />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
