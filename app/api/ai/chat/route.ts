import { type NextRequest, NextResponse } from "next/server"

interface ChatRequest {
  message: string
  settings: {
    model: "together" | "groq"
    temperature: number
    maxTokens: number
    enableThinking: boolean
    enableSearch: boolean
  }
  history: Array<{
    role: "user" | "assistant"
    content: string
  }>
}

// Together AI API call
async function callTogetherAPI(messages: any[], settings: any) {
  const response = await fetch("https://api.together.xyz/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free",
      messages,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
      stream: false,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Together API error: ${response.status} - ${errorText}`)
  }

  return response.json()
}

// Groq API call
async function callGroqAPI(messages: any[], settings: any) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "qwen-qwq-32b",
      messages,
      temperature: settings.temperature,
      max_completion_tokens: settings.maxTokens,
      top_p: 0.95,
      stream: false,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Groq API error: ${response.status} - ${errorText}`)
  }

  return response.json()
}

// Create enhanced system prompt
function createSystemPrompt(settings: any): string {
  let prompt = `أنت drx3، مساعد ذكي متخصص في الذكاء الاصطناعي والبرمجة والتكنولوجيا.

خصائصك:
- خبير في Python، JavaScript، الذكاء الاصطناعي، والتعلم الآلي
- تجيب باللغة العربية بشكل أساسي مع دعم الإنجليزية عند الحاجة
- تقدم إجابات منظمة ومفصلة ومفيدة
- تستخدم التنسيق المناسب (عناوين، قوائم، كود)
- تشرح المفاهيم بطريقة واضحة ومنطقية

إرشادات التنسيق:
- استخدم العناوين (# ## ###) لتنظيم المحتوى
- استخدم القوائم المرقمة والنقطية عند الحاجة
- ضع الكود في صناديق مع تحديد اللغة
- استخدم النص الغامق للنقاط المهمة
- نظم الإجابة بشكل هرمي وواضح

إرشادات المحتوى:
- كن دقيقاً ومفيداً
- قدم أمثلة عملية عند الحاجة
- اشرح الخطوات بوضوح
- اربط المفاهيم ببعضها البعض`

  if (settings.enableThinking) {
    prompt += "\n- فكر خطوة بخطوة قبل الإجابة وأظهر عملية التفكير"
  }

  if (settings.enableSearch) {
    prompt += "\n- ابحث في معرفتك بعمق للحصول على أفضل إجابة شاملة"
  }

  return prompt
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { message, settings, history } = body

    // Validate input
    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Prepare messages for API
    const messages = [
      {
        role: "system",
        content: createSystemPrompt(settings),
      },
      // Add recent history for context
      ...history.slice(-6).map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user",
        content: message,
      },
    ]

    const startTime = Date.now()
    let response
    let actualModel = settings.model

    try {
      // Call the selected model
      if (settings.model === "together") {
        response = await callTogetherAPI(messages, settings)
        actualModel = "Together AI (DeepSeek-R1)"
      } else {
        response = await callGroqAPI(messages, settings)
        actualModel = "Groq (Qwen-QwQ-32B)"
      }
    } catch (error) {
      console.error(`Primary model (${settings.model}) failed:`, error)

      // Try fallback model
      try {
        if (settings.model === "together") {
          response = await callGroqAPI(messages, settings)
          actualModel = "Groq (Qwen-QwQ-32B) - Fallback"
        } else {
          response = await callTogetherAPI(messages, settings)
          actualModel = "Together AI (DeepSeek-R1) - Fallback"
        }
      } catch (fallbackError) {
        console.error("Fallback model also failed:", fallbackError)
        return NextResponse.json(
          {
            content: "عذراً، أواجه مشكلة تقنية مؤقتة. يرجى المحاولة مرة أخرى.",
            model: "error",
            tokens: 0,
            processingTime: Date.now() - startTime,
          },
          { status: 500 },
        )
      }
    }

    const processingTime = Date.now() - startTime
    const content = response.choices[0]?.message?.content || "عذراً، لم أتمكن من إنتاج رد مناسب."

    return NextResponse.json({
      content,
      model: actualModel,
      tokens: response.usage?.total_tokens || Math.floor(content.length / 4),
      processingTime,
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      {
        content: "حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى.",
        model: "error",
        tokens: 0,
        processingTime: 0,
      },
      { status: 500 },
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    models: {
      together: !!process.env.TOGETHER_API_KEY,
      groq: !!process.env.GROQ_API_KEY,
    },
  })
}
