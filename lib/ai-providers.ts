import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"

// Initialize providers with API keys
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export interface AIProviderConfig {
  provider: "groq" | "together" | "auto"
  model?: string
  temperature?: number
  max_tokens?: number
  deep_thinking?: boolean
}

export interface AIResponse {
  success: boolean
  response?: string
  error?: string
  metadata?: {
    provider: string
    model: string
    processing_time: number
    tokens_used?: number
    confidence?: number
  }
}

// Together AI implementation
class TogetherAI {
  private apiKey: string
  private baseUrl = "https://api.together.xyz/v1"

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async generateText(prompt: string, options: AIProviderConfig): Promise<AIResponse> {
    const startTime = Date.now()

    try {
      const model = options.deep_thinking
        ? "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo"
        : "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: "أنت Dr X، مساعد ذكي متقدم يجيب باللغة العربية بطريقة مفيدة ودقيقة ومفصلة.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 2000,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Together API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      const processingTime = Date.now() - startTime

      return {
        success: true,
        response: data.choices[0]?.message?.content || "لم يتم إنتاج رد",
        metadata: {
          provider: "together",
          model,
          processing_time: processingTime,
          tokens_used: data.usage?.total_tokens || 0,
          confidence: 0.9,
        },
      }
    } catch (error) {
      const processingTime = Date.now() - startTime
      console.error("Together AI Error:", error)

      return {
        success: false,
        error: error instanceof Error ? error.message : "خطأ غير معروف",
        metadata: {
          provider: "together",
          model: "unknown",
          processing_time: processingTime,
          confidence: 0,
        },
      }
    }
  }

  async generateStreamResponse(
    prompt: string,
    onChunk: (chunk: string) => void,
    options: AIProviderConfig,
  ): Promise<void> {
    const model = options.deep_thinking
      ? "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo"
      : "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "أنت Dr X، مساعد ذكي متقدم يجيب باللغة العربية بطريقة مفيدة ودقيقة ومفصلة.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2000,
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`Together API error: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error("No response body")

    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") return

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                onChunk(content)
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }
}

// Groq implementation
class GroqAI {
  async generateText(prompt: string, options: AIProviderConfig): Promise<AIResponse> {
    const startTime = Date.now()

    try {
      const model = options.deep_thinking ? "llama-3.1-70b-versatile" : "llama-3.1-8b-instant"

      const { text, usage } = await generateText({
        model: groq(model),
        prompt,
        temperature: options.temperature || 0.7,
        maxTokens: options.max_tokens || 2000,
      })

      const processingTime = Date.now() - startTime

      return {
        success: true,
        response: text,
        metadata: {
          provider: "groq",
          model,
          processing_time: processingTime,
          tokens_used: usage?.totalTokens || 0,
          confidence: 0.95,
        },
      }
    } catch (error) {
      const processingTime = Date.now() - startTime
      console.error("Groq AI Error:", error)

      return {
        success: false,
        error: error instanceof Error ? error.message : "خطأ غير معروف",
        metadata: {
          provider: "groq",
          model: "unknown",
          processing_time: processingTime,
          confidence: 0,
        },
      }
    }
  }

  async generateStreamResponse(
    prompt: string,
    onChunk: (chunk: string) => void,
    options: AIProviderConfig,
  ): Promise<void> {
    const model = options.deep_thinking ? "llama-3.1-70b-versatile" : "llama-3.1-8b-instant"

    const { textStream } = await generateText({
      model: groq(model),
      prompt,
      temperature: options.temperature || 0.7,
      maxTokens: options.max_tokens || 2000,
    })

    for await (const chunk of textStream) {
      onChunk(chunk)
    }
  }
}

// Main AI orchestrator
export class DrXAI {
  private together: TogetherAI
  private groq: GroqAI

  constructor() {
    this.together = new TogetherAI(process.env.TOGETHER_API_KEY || "")
    this.groq = new GroqAI()
  }

  async generateResponse(prompt: string, options: AIProviderConfig = { provider: "auto" }): Promise<AIResponse> {
    let provider = options.provider

    // Auto-select provider based on availability
    if (provider === "auto") {
      provider = process.env.GROQ_API_KEY ? "groq" : "together"
    }

    try {
      let response: AIResponse

      if (provider === "together" && process.env.TOGETHER_API_KEY) {
        response = await this.together.generateText(prompt, options)

        // Fallback to Groq if Together fails
        if (!response.success && process.env.GROQ_API_KEY) {
          console.warn("Together AI failed, falling back to Groq:", response.error)
          response = await this.groq.generateText(prompt, { ...options, provider: "groq" })
        }
      } else if (provider === "groq" && process.env.GROQ_API_KEY) {
        response = await this.groq.generateText(prompt, options)

        // Fallback to Together if Groq fails
        if (!response.success && process.env.TOGETHER_API_KEY) {
          console.warn("Groq failed, falling back to Together AI:", response.error)
          response = await this.together.generateText(prompt, { ...options, provider: "together" })
        }
      } else {
        return {
          success: false,
          error: "لا توجد مفاتيح API صالحة متاحة",
        }
      }

      return response
    } catch (error) {
      console.error("DrXAI Error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "خطأ غير معروف",
      }
    }
  }

  async generateStreamResponse(
    prompt: string,
    onChunk: (chunk: string) => void,
    options: AIProviderConfig = { provider: "auto" },
  ): Promise<void> {
    let provider = options.provider

    if (provider === "auto") {
      provider = process.env.GROQ_API_KEY ? "groq" : "together"
    }

    try {
      if (provider === "together" && process.env.TOGETHER_API_KEY) {
        await this.together.generateStreamResponse(prompt, onChunk, options)
      } else if (provider === "groq" && process.env.GROQ_API_KEY) {
        await this.groq.generateStreamResponse(prompt, onChunk, options)
      } else {
        throw new Error("لا توجد مفاتيح API صالحة متاحة")
      }
    } catch (error) {
      console.error("Stream generation error:", error)
      onChunk(`خطأ في توليد الاستجابة: ${error instanceof Error ? error.message : "خطأ غير معروف"}`)
    }
  }

  async testProviders(): Promise<Record<string, boolean>> {
    const testPrompt = "مرحبا، كيف حالك؟"
    const results: Record<string, boolean> = {}

    // Test Together AI
    if (process.env.TOGETHER_API_KEY) {
      try {
        const togetherResponse = await this.together.generateText(testPrompt, { provider: "together" })
        results.together = togetherResponse.success
      } catch (error) {
        results.together = false
      }
    } else {
      results.together = false
    }

    // Test Groq
    if (process.env.GROQ_API_KEY) {
      try {
        const groqResponse = await this.groq.generateText(testPrompt, { provider: "groq" })
        results.groq = groqResponse.success
      } catch (error) {
        results.groq = false
      }
    } else {
      results.groq = false
    }

    return results
  }

  async getSystemHealth(): Promise<{
    database: boolean
    providers: Record<string, boolean>
    overall: boolean
    timestamp: string
  }> {
    try {
      // Test database connection
      const { DrXDatabase } = await import("./database")
      const database = await DrXDatabase.healthCheck()

      // Test providers
      const providers = await this.testProviders()
      const overall = database && Object.values(providers).some((status) => status)

      return {
        database,
        providers,
        overall,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      console.error("System health check error:", error)
      return {
        database: false,
        providers: { groq: false, together: false },
        overall: false,
        timestamp: new Date().toISOString(),
      }
    }
  }
}

export const aiOrchestrator = new DrXAI()
export default DrXAI
