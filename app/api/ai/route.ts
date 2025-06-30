import { NextRequest, NextResponse } from "next/server"
import { aiOrchestrator } from "@/lib/ai-providers"
import { DrXDatabase } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { message, config = {} } = body

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { 
          success: false, 
          error: "الرسالة مطلوبة ويجب أن تكون نص" 
        },
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      )
    }

    // Generate AI response
    const response = await aiOrchestrator.generateResponse(message, config)

    // Log the interaction
    try {
      await DrXDatabase.logUsage({
        provider: response.metadata?.provider || "unknown",
        model: response.metadata?.model || "unknown",
        processing_time_ms: response.metadata?.processing_time || 0,
        tokens_used: response.metadata?.tokens_used || 0,
        success: response.success,
        error_message: response.error || null,
        metadata: { message_length: message.length, config },
      })
    } catch (logError) {
      console.warn("Failed to log usage:", logError)
    }

    return NextResponse.json(response, {
      headers: { "Content-Type": "application/json" }
    })

  } catch (error) {
    console.error("AI API Error:", error)
    
    return NextResponse.json(
      {
        success: false,
        error: "حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى.",
        details: error instanceof Error ? error.message : "خطأ غير معروف"
      },
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
}

export async function GET() {
  try {
    const health = await aiOrchestrator.getSystemHealth()
    
    return NextResponse.json({
      success: true,
      data: health
    }, {
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    console.error("Health check error:", error)
    
    return NextResponse.json(
      {
        success: false,
        error: "فشل في فحص حالة النظام",
        details: error instanceof Error ? error.message : "خطأ غير معروف"
      },
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
}
