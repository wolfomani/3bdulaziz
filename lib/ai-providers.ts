import { createGroq } from "@ai-sdk/groq"
import { createOpenAI } from "@ai-sdk/openai"

// إعداد مزودي الذكاء الاصطناعي
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY!,
  baseURL: "https://api.groq.com/openai/v1",
})

const together = createOpenAI({
  apiKey: process.env.TOGETHER_API_KEY!,
  baseURL: "https://api.together.xyz/v1",
})

// تكوين النماذج المتاحة
export const AI_MODELS = {
  groq: {
    "llama-3.1-70b-versatile": {
      name: "Llama 3.1 70B",
      provider: "groq",
      maxTokens: 8192,
      costPer1kTokens: 0.0008,
      strengths: ["reasoning", "coding", "arabic"],
      speed: "fast",
    },
    "llama-3.1-8b-instant": {
      name: "Llama 3.1 8B",
      provider: "groq",
      maxTokens: 8192,
      costPer1kTokens: 0.0002,
      strengths: ["speed", "simple-tasks"],
      speed: "ultra-fast",
    },
    "mixtral-8x7b-32768": {
      name: "Mixtral 8x7B",
      provider: "groq",
      maxTokens: 32768,
      costPer1kTokens: 0.0006,
      strengths: ["multilingual", "long-context"],
      speed: "fast",
    },
  },
  together: {
    "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo": {
      name: "Llama 3.1 70B Turbo",
      provider: "together",
      maxTokens: 8192,
      costPer1kTokens: 0.0009,
      strengths: ["reasoning", "creative-writing"],
      speed: "medium",
    },
    "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo": {
      name: "Llama 3.1 8B Turbo",
      provider: "together",
      maxTokens: 8192,
      costPer1kTokens: 0.0002,
      strengths: ["efficiency", "general-purpose"],
      speed: "fast",
    },
    "mistralai/Mixtral-8x7B-Instruct-v0.1": {
      name: "Mixtral 8x7B",
      provider: "together",
      maxTokens: 32768,
      costPer1kTokens: 0.0006,
      strengths: ["multilingual", "code-generation"],
      speed: "medium",
    },
  },
}

// نظام اختيار النموذج الذكي
export class SmartModelSelector {
  private static rateLimits = new Map<string, { count: number; resetTime: number }>()
  private static cache = new Map<string, { response: any; timestamp: number; confidence: number }>()

  static selectBestModel(query: string, userPreferences?: any) {
    const analysis = this.analyzeQuery(query)
    const availableModels = this.getAvailableModels()

    // تسجيل النقاط لكل نموذج
    const scores = availableModels.map((model) => ({
      model,
      score: this.calculateScore(model, analysis, userPreferences),
    }))

    // ترتيب حسب النقاط
    scores.sort((a, b) => b.score - a.score)

    return scores[0].model
  }

  private static analyzeQuery(query: string) {
    const arabicPattern = /[\u0600-\u06FF]/
    const codePattern = /```|function|class|import|export|const|let|var/
    const complexPattern = /explain|analyze|compare|detailed|comprehensive/i

    return {
      isArabic: arabicPattern.test(query),
      isCode: codePattern.test(query),
      isComplex: complexPattern.test(query) || query.length > 500,
      length: query.length,
      sentiment: this.analyzeSentiment(query),
      topics: this.extractTopics(query),
    }
  }

  private static analyzeSentiment(text: string): "positive" | "negative" | "neutral" {
    const positiveWords = ["good", "great", "excellent", "amazing", "جيد", "ممتاز", "رائع"]
    const negativeWords = ["bad", "terrible", "awful", "horrible", "سيء", "فظيع"]

    const positiveCount = positiveWords.filter((word) => text.toLowerCase().includes(word.toLowerCase())).length

    const negativeCount = negativeWords.filter((word) => text.toLowerCase().includes(word.toLowerCase())).length

    if (positiveCount > negativeCount) return "positive"
    if (negativeCount > positiveCount) return "negative"
    return "neutral"
  }

  private static extractTopics(text: string): string[] {
    const topics = []
    const techKeywords = ["programming", "code", "software", "برمجة", "كود"]
    const scienceKeywords = ["science", "research", "study", "علم", "بحث"]
    const businessKeywords = ["business", "marketing", "finance", "أعمال", "تسويق"]

    if (techKeywords.some((keyword) => text.toLowerCase().includes(keyword.toLowerCase()))) {
      topics.push("technology")
    }
    if (scienceKeywords.some((keyword) => text.toLowerCase().includes(keyword.toLowerCase()))) {
      topics.push("science")
    }
    if (businessKeywords.some((keyword) => text.toLowerCase().includes(keyword.toLowerCase()))) {
      topics.push("business")
    }

    return topics
  }

  private static getAvailableModels() {
    const allModels = [
      ...Object.entries(AI_MODELS.groq).map(([id, config]) => ({ id, ...config })),
      ...Object.entries(AI_MODELS.together).map(([id, config]) => ({ id, ...config })),
    ]

    // تصفية النماذج المتاحة (غير محظورة بسبب Rate Limiting)
    return allModels.filter((model) => !this.isRateLimited(model.id))
  }

  private static calculateScore(model: any, analysis: any, userPreferences?: any): number {
    let score = 0

    // نقاط القوة
    if (analysis.isArabic && model.strengths.includes("arabic")) score += 30
    if (analysis.isCode && model.strengths.includes("coding")) score += 25
    if (analysis.isComplex && model.strengths.includes("reasoning")) score += 20
    if (model.strengths.includes("multilingual")) score += 15

    // السرعة
    const speedScores = { "ultra-fast": 20, fast: 15, medium: 10, slow: 5 }
    score += speedScores[model.speed] || 0

    // التكلفة (أقل تكلفة = نقاط أكثر)
    score += Math.max(0, 10 - model.costPer1kTokens * 10000)

    // تفضيلات المستخدم
    if (userPreferences?.preferredProvider === model.provider) score += 10
    if (userPreferences?.prioritizeSpeed && model.speed === "ultra-fast") score += 15
    if (userPreferences?.prioritizeCost && model.costPer1kTokens < 0.0005) score += 15

    return score
  }

  private static isRateLimited(modelId: string): boolean {
    const limit = this.rateLimits.get(modelId)
    if (!limit) return false

    const now = Date.now()
    if (now > limit.resetTime) {
      this.rateLimits.delete(modelId)
      return false
    }

    return limit.count >= 100 // حد أقصى 100 طلب في الساعة
  }

  static recordUsage(modelId: string) {
    const now = Date.now()
    const hourFromNow = now + 60 * 60 * 1000

    const current = this.rateLimits.get(modelId) || { count: 0, resetTime: hourFromNow }
    current.count++

    if (now > current.resetTime) {
      current.count = 1
      current.resetTime = hourFromNow
    }

    this.rateLimits.set(modelId, current)
  }

  static getCachedResponse(query: string) {
    const cached = this.cache.get(query)
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > 30 * 60 * 1000 // 30 دقيقة
    if (isExpired) {
      this.cache.delete(query)
      return null
    }

    return cached
  }

  static setCachedResponse(query: string, response: any, confidence: number) {
    this.cache.set(query, {
      response,
      timestamp: Date.now(),
      confidence,
    })

    // تنظيف الذاكرة المؤقتة (الاحتفاظ بـ 1000 استجابة فقط)
    if (this.cache.size > 1000) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }
  }
}

// دالة للحصول على النموذج
export function getModel(modelId: string) {
  if (modelId.startsWith("groq/")) {
    const modelName = modelId.replace("groq/", "")
    return groq(modelName)
  } else if (modelId.startsWith("together/")) {
    const modelName = modelId.replace("together/", "")
    return together(modelName)
  }

  throw new Error(`Unsupported model: ${modelId}`)
}

// دالة لتقدير التكلفة
export function estimateCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const allModels = { ...AI_MODELS.groq, ...AI_MODELS.together }
  const model = allModels[modelId.replace(/^(groq|together)\//, "")]

  if (!model) return 0

  const totalTokens = inputTokens + outputTokens
  return (totalTokens / 1000) * model.costPer1kTokens
}

// دالة لحساب درجة الثقة
export function calculateConfidence(response: string, model: any): number {
  let confidence = 0.7 // قيمة أساسية

  // طول الاستجابة
  if (response.length > 100) confidence += 0.1
  if (response.length > 500) confidence += 0.1

  // جودة النموذج
  if (model.name.includes("70B")) confidence += 0.1
  if (model.strengths.includes("reasoning")) confidence += 0.05

  // تماسك النص
  const sentences = response.split(/[.!?]+/).filter((s) => s.trim().length > 0)
  if (sentences.length > 2) confidence += 0.05

  return Math.min(confidence, 1.0)
}

export { groq, together }
