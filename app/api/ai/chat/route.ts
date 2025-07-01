import { type NextRequest, NextResponse } from "next/server"
import { generateAIResponse, checkProvidersHealth } from "@/lib/ai-providers"
import { AuthService } from "@/lib/auth"
import DrXDatabase from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const token = request.cookies.get("auth_token")?.value
    let user = null

    if (token) {
      const sessionResult = await AuthService.validateSession(token)
      user = sessionResult?.user || null
    }

    const { message, conversationId, systemPrompt } = await request.json()

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Generate AI response
    const startTime = Date.now()
    const aiResponse = await generateAIResponse(message, {
      userId: user?.id,
      conversationId,
      systemPrompt,
    })

    // Save conversation if user is logged in
    let conversation = null
    if (user) {
      // Create or get conversation
      if (conversationId) {
        conversation = await DrXDatabase.getConversation(conversationId)
      } else {
        conversation = await DrXDatabase.createConversation({
          user_id: user.id,
          title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
          metadata: {
            provider: aiResponse.provider,
            model: aiResponse.model,
          },
        })
      }

      // Save messages
      await DrXDatabase.createMessage({
        conversation_id: conversation.id,
        role: "user",
        content: message,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      })

      await DrXDatabase.createMessage({
        conversation_id: conversation.id,
        role: "assistant",
        content: aiResponse.content,
        metadata: {
          provider: aiResponse.provider,
          model: aiResponse.model,
          tokens_used: aiResponse.tokensUsed,
          cost: aiResponse.cost,
          confidence: aiResponse.confidence,
          processing_time: aiResponse.processingTime,
        },
      })

      // Log usage analytics
      await DrXDatabase.logUsage({
        session_id: user.id,
        provider: aiResponse.provider,
        model: aiResponse.model,
        tokens_used: aiResponse.tokensUsed,
        processing_time_ms: Date.now() - startTime,
        success: true,
        metadata: {
          conversation_id: conversation.id,
          user_id: user.id,
          cached: aiResponse.cached,
        },
      })
    }

    return NextResponse.json({
      success: true,
      response: aiResponse.content,
      metadata: {
        provider: aiResponse.provider,
        model: aiResponse.model,
        tokensUsed: aiResponse.tokensUsed,
        cost: aiResponse.cost,
        confidence: aiResponse.confidence,
        processingTime: aiResponse.processingTime,
        cached: aiResponse.cached,
        conversationId: conversation?.id,
      },
    })
  } catch (error) {
    console.error("Chat API error:", error)

    // Log failed usage
    const token = request.cookies.get("auth_token")?.value
    if (token) {
      const sessionResult = await AuthService.validateSession(token)
      if (sessionResult?.user) {
        await DrXDatabase.logUsage({
          session_id: sessionResult.user.id,
          provider: "unknown",
          model: "unknown",
          tokens_used: 0,
          processing_time_ms: 0,
          success: false,
          error_message: error instanceof Error ? error.message : "Unknown error",
          metadata: {},
        })
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const health = await checkProvidersHealth()

    return NextResponse.json({
      success: true,
      providers: health,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Health check failed" }, { status: 500 })
  }
}
