import type { NextRequest } from "next/server"
import { aiOrchestrator } from "@/lib/ai-providers"

export async function POST(request: NextRequest) {
  try {
    const { message, config, context } = await request.json()

    if (!message || typeof message !== "string") {
      return new Response("رسالة غير صالحة", { status: 400 })
    }

    // Build enhanced prompt with context
    let enhancedPrompt = message

    if (context && context.length > 0) {
      const contextStr = context
        .filter((msg: any) => msg.sender === "user")
        .slice(-3)
        .map((msg: any) => msg.text)
        .join("\n")

      enhancedPrompt = `السياق السابق:\n${contextStr}\n\nالسؤال الحالي: ${message}`
    }

    // Add system instructions
    if (config?.ragEnabled) {
      enhancedPrompt = `[نظام RAG مفعل] استخدم قاعدة المعرفة للإجابة بدقة.\n${enhancedPrompt}`
    }

    if (config?.deepSearch) {
      enhancedPrompt = `[بحث عميق مطلوب] قم بتحليل شامل ومتعمق.\n${enhancedPrompt}`
    }

    if (config?.thinkMode) {
      enhancedPrompt = `[وضع التفكير] فكر خطوة بخطوة قبل الإجابة.\n${enhancedPrompt}`
    }

    // Create a readable stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const aiConfig = {
            provider: config?.provider || "auto",
            model: config?.model,
            temperature: config?.temperature || 0.7,
            max_tokens: config?.maxTokens || 2000,
            deep_thinking: config?.thinkMode || false,
          }

          await aiOrchestrator.generateStreamResponse(
            enhancedPrompt,
            (chunk: string) => {
              const data = JSON.stringify({ content: chunk })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            },
            aiConfig,
          )

          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          controller.close()
        } catch (error) {
          console.error("Stream error:", error)
          const errorData = JSON.stringify({
            error: error instanceof Error ? error.message : "خطأ غير معروف",
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Stream API Error:", error)
    return new Response("خطأ داخلي في الخادم", { status: 500 })
  }
}
