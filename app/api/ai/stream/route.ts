import type { NextRequest } from "next/server"
import { streamText } from "ai"
import { SmartModelSelector, getModel } from "@/lib/ai-providers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, conversationId, userId, providerId, model, maxTokens, temperature } = body

    // التحقق من صحة البيانات
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "الرسائل مطلوبة ويجب أن تكون مصفوفة غير فارغة" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const lastMessage = messages[messages.length - 1]
    let selectedModel = model

    if (!selectedModel) {
      const bestModel = SmartModelSelector.selectBestModel(lastMessage.content)
      selectedModel = `${bestModel.provider}/${bestModel.id}`
    }

    const aiModel = getModel(selectedModel)
    SmartModelSelector.recordUsage(selectedModel)

    // إضافة رسالة النظام
    const systemMessage = {
      role: "system" as const,
      content: `أنت مساعد ذكي متقدم. تجيب بوضوح ودقة. 
      إذا كان السؤال بالعربية، أجب بالعربية الفصحى المبسطة.
      إذا كان بالإنجليزية، أجب بالإنجليزية.`,
    }

    const result = await streamText({
      model: aiModel,
      messages: [systemMessage, ...messages],
      temperature: temperature || 0.7,
      maxTokens: maxTokens || 2048,
      onFinish: async (result) => {
        // تسجيل الإحصائيات
        console.log("Stream finished:", {
          model: selectedModel,
          usage: result.usage,
          finishReason: result.finishReason,
        })
      },
    })

    return result.toAIStreamResponse()
  } catch (error) {
    console.error("خطأ في إعداد البث المباشر:", error)

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "حدث خطأ في إعداد البث المباشر",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
