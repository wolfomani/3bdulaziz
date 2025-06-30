import type { NextRequest } from "next/server"
import { aiOrchestrator } from "@/lib/ai-providers"

export async function POST(request: NextRequest) {
  try {
    const { message, options } = await request.json()

    if (!message) {
      return new Response("Message is required", { status: 400 })
    }

    // Create a readable stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await aiOrchestrator.generateStreamResponse(
            message,
            (chunk: string) => {
              const data = encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`)
              controller.enqueue(data)
            },
            {
              provider: options?.provider || "together",
              temperature: options?.temperature || 0.7,
              max_tokens: options?.max_tokens || 2000,
            },
          )

          // Send completion signal
          const endData = encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
          controller.enqueue(endData)
          controller.close()
        } catch (error) {
          console.error("Stream error:", error)
          const errorData = encoder.encode(`data: ${JSON.stringify({ error: "حدث خطأ في معالجة الطلب" })}\n\n`)
          controller.enqueue(errorData)
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Stream API Error:", error)
    return new Response("Internal server error", { status: 500 })
  }
}
