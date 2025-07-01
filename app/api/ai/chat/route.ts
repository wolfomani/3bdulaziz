import { type NextRequest, NextResponse } from "next/server"
import { generateText, streamText } from "ai"
import { SmartModelSelector, getModel, estimateCost, calculateConfidence } from "@/lib/ai-providers"
import { createClient } from "@/lib/database"
import { getRedisClient } from "@/lib/redis-cache"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
  timestamp?: number
}

interface ChatRequest {
  messages: ChatMessage[]
  model?: string
  stream?: boolean
  temperature?: number
  maxTokens?: number
  userId?: string
  sessionId?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { messages, model, stream = false, temperature = 0.7, maxTokens = 2048, userId, sessionId } = body

    // التحقق من صحة البيانات
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array is required and cannot be empty" }, { status: 400 })
    }

    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role !== "user") {
      return NextResponse.json({ error: "Last message must be from user" }, { status: 400 })
    }

    // التحقق من الذاكرة المؤقتة
    const cacheKey = `chat:${JSON.stringify({ messages: messages.slice(-3), model })}`
    const redis = await getRedisClient()
    const cachedResponse = await redis?.get(cacheKey)

    if (cachedResponse) {
      const parsed = JSON.parse(cachedResponse)
      return NextResponse.json({
        ...parsed,
        cached: true,
        timestamp: Date.now(),
      })
    }

    // تحليل الرسالة واختيار النموذج الأمثل
    const userQuery = lastMessage.content
    const queryAnalysis = analyzeMessage(userQuery)

    let selectedModel = model
    if (!selectedModel) {
      const bestModel = SmartModelSelector.selectBestModel(userQuery, { userId })
      selectedModel = `${bestModel.provider}/${bestModel.id}`
    }

    // تحسين السياق والرسائل
    const optimizedMessages = optimizeContext(messages, maxTokens)

    // إضافة رسالة النظام للغة العربية
    const systemMessage = {
      role: "system" as const,
      content: `أنت مساعد ذكي متقدم يتحدث العربية والإنجليزية بطلاقة. 
      تتميز بالدقة والوضوح في الإجابات. 
      عندما تتحدث بالعربية، استخدم اللغة الفصحى المبسطة.
      اجعل إجاباتك مفيدة وشاملة ومنظمة بشكل جيد.`,
    }

    const finalMessages = [systemMessage, ...optimizedMessages]

    // الحصول على النموذج
    const aiModel = getModel(selectedModel)

    // تسجيل الاستخدام
    SmartModelSelector.recordUsage(selectedModel)

    let response: any
    let usage: any = {}
    let confidence = 0.7

    if (stream) {
      // البث المباشر
      const result = await streamText({
        model: aiModel,
        messages: finalMessages,
        temperature,
        maxTokens,
      })

      return new Response(result.toAIStreamResponse().body, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      })
    } else {
      // الاستجابة العادية
      const result = await generateText({
        model: aiModel,
        messages: finalMessages,
        temperature,
        maxTokens,
      })

      response = result.text
      usage = result.usage || {}
      confidence = calculateConfidence(response, { name: selectedModel })

      // حفظ في الذاكرة المؤقتة
      const responseData = {
        response,
        model: selectedModel,
        usage,
        confidence,
        analysis: queryAnalysis,
        cost: estimateCost(selectedModel, usage.promptTokens || 0, usage.completionTokens || 0),
      }

      if (redis && confidence > 0.8) {
        await redis.setex(cacheKey, 1800, JSON.stringify(responseData)) // 30 دقيقة
      }

      // حفظ في قاعدة البيانات
      if (userId && sessionId) {
        await saveConversation(userId, sessionId, {
          userMessage: userQuery,
          assistantResponse: response,
          model: selectedModel,
          usage,
          confidence,
          analysis: queryAnalysis,
        })
      }

      return NextResponse.json({
        ...responseData,
        timestamp: Date.now(),
        cached: false,
      })
    }
  } catch (error) {
    console.error("Chat API Error:", error)

    // نظام الاحتياط - جرب نموذج آخر
    try {
      const fallbackModel = "groq/llama-3.1-8b-instant"
      const aiModel = getModel(fallbackModel)

      const result = await generateText({
        model: aiModel,
        messages: [{ role: "user", content: "مرحبا، يبدو أن هناك مشكلة تقنية. كيف يمكنني مساعدتك؟" }],
        temperature: 0.7,
        maxTokens: 1024,
      })

      return NextResponse.json({
        response: result.text,
        model: fallbackModel,
        fallback: true,
        error: "Primary model failed, using fallback",
        timestamp: Date.now(),
      })
    } catch (fallbackError) {
      return NextResponse.json(
        {
          error: "AI service temporarily unavailable",
          details: error instanceof Error ? error.message : "Unknown error",
          timestamp: Date.now(),
        },
        { status: 500 },
      )
    }
  }
}

function analyzeMessage(message: string) {
  const arabicPattern = /[\u0600-\u06FF]/
  const codePattern = /```|function|class|import|export|const|let|var/
  const questionPattern = /\?|كيف|ماذا|متى|أين|لماذا|هل/
  const urgentPattern = /urgent|عاجل|سريع|فوري/i

  return {
    language: arabicPattern.test(message) ? "arabic" : "english",
    hasCode: codePattern.test(message),
    isQuestion: questionPattern.test(message),
    isUrgent: urgentPattern.test(message),
    length: message.length,
    complexity: message.length > 500 ? "high" : message.length > 100 ? "medium" : "low",
    sentiment: analyzeSentiment(message),
    topics: extractTopics(message),
  }
}

function analyzeSentiment(text: string): "positive" | "negative" | "neutral" {
  const positiveWords = ["good", "great", "excellent", "amazing", "جيد", "ممتاز", "رائع", "شكرا"]
  const negativeWords = ["bad", "terrible", "awful", "horrible", "سيء", "فظيع", "مشكلة"]

  const lowerText = text.toLowerCase()
  const positiveCount = positiveWords.filter((word) => lowerText.includes(word)).length
  const negativeCount = negativeWords.filter((word) => lowerText.includes(word)).length

  if (positiveCount > negativeCount) return "positive"
  if (negativeCount > positiveCount) return "negative"
  return "neutral"
}

function extractTopics(text: string): string[] {
  const topics = []
  const lowerText = text.toLowerCase()

  const topicKeywords = {
    technology: ["programming", "code", "software", "برمجة", "كود", "تقنية"],
    science: ["science", "research", "study", "علم", "بحث", "دراسة"],
    business: ["business", "marketing", "finance", "أعمال", "تسويق", "مال"],
    education: ["education", "learning", "study", "تعليم", "تعلم", "دراسة"],
    health: ["health", "medical", "doctor", "صحة", "طبي", "طبيب"],
  }

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some((keyword) => lowerText.includes(keyword))) {
      topics.push(topic)
    }
  }

  return topics
}

function optimizeContext(messages: ChatMessage[], maxTokens: number): ChatMessage[] {
  // تقدير تقريبي: 4 أحرف = 1 token
  const estimateTokens = (text: string) => Math.ceil(text.length / 4)

  let totalTokens = 0
  const optimizedMessages: ChatMessage[] = []

  // ابدأ من آخر رسالة واعمل للخلف
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    const messageTokens = estimateTokens(message.content)

    if (totalTokens + messageTokens > maxTokens * 0.7) {
      // احتفظ بـ 30% للاستجابة
      break
    }

    optimizedMessages.unshift(message)
    totalTokens += messageTokens
  }

  // تأكد من وجود رسالة المستخدم الأخيرة على الأقل
  if (optimizedMessages.length === 0 && messages.length > 0) {
    optimizedMessages.push(messages[messages.length - 1])
  }

  return optimizedMessages
}

async function saveConversation(userId: string, sessionId: string, data: any) {
  try {
    const db = createClient()

    await db.query(
      `
      INSERT INTO conversations (
        user_id, session_id, user_message, assistant_response, 
        model_used, tokens_used, confidence_score, message_analysis, 
        cost_estimate, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    `,
      [
        userId,
        sessionId,
        data.userMessage,
        data.assistantResponse,
        data.model,
        JSON.stringify(data.usage),
        data.confidence,
        JSON.stringify(data.analysis),
        data.cost || 0,
      ],
    )
  } catch (error) {
    console.error("Failed to save conversation:", error)
  }
}

export async function GET() {
  return NextResponse.json({
    status: "AI Chat API is running",
    models: {
      groq: Object.keys(require("@/lib/ai-providers").AI_MODELS.groq),
      together: Object.keys(require("@/lib/ai-providers").AI_MODELS.together),
    },
    features: [
      "Smart model selection",
      "Arabic language support",
      "Caching system",
      "Usage analytics",
      "Fallback system",
      "Streaming support",
    ],
    timestamp: Date.now(),
  })
}
