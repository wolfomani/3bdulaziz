export interface AIProviderConfig {
  provider: "together" | "groq"
  model?: string
  temperature?: number
  max_tokens?: number
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
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free",
          messages: [
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
          model: "DeepSeek-R1-Distill-Llama-70B",
          processing_time: processingTime,
          tokens_used: data.usage?.total_tokens || 0,
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
        },
      }
    }
  }
}

// Groq AI implementation
class GroqAI {
  private apiKey: string
  private baseUrl = "https://api.groq.com/openai/v1"

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async generateText(prompt: string, options: AIProviderConfig): Promise<AIResponse> {
    const startTime = Date.now()

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "qwen-qwq-32b",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: options.temperature || 0.6,
          max_completion_tokens: options.max_tokens || 4096,
          top_p: 0.95,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Groq API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      const processingTime = Date.now() - startTime

      return {
        success: true,
        response: data.choices[0]?.message?.content || "لم يتم إنتاج رد",
        metadata: {
          provider: "groq",
          model: "qwen-qwq-32b",
          processing_time: processingTime,
          tokens_used: data.usage?.total_tokens || 0,
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
        },
      }
    }
  }
}

// Main AI orchestrator
export class DrXAI {
  private together: TogetherAI
  private groq: GroqAI

  constructor() {
    this.together = new TogetherAI(process.env.TOGETHER_API_KEY || "")
    this.groq = new GroqAI(process.env.GROQ_API_KEY || "")
  }

  async generateResponse(prompt: string, options: AIProviderConfig = { provider: "together" }): Promise<AIResponse> {
    try {
      let response: AIResponse

      if (options.provider === "together" && process.env.TOGETHER_API_KEY) {
        response = await this.together.generateText(prompt, options)

        // Fallback to Groq if Together fails
        if (!response.success && process.env.GROQ_API_KEY) {
          console.warn("Together AI failed, falling back to Groq:", response.error)
          response = await this.groq.generateText(prompt, { ...options, provider: "groq" })
        }
      } else if (options.provider === "groq" && process.env.GROQ_API_KEY) {
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

  async getAvailableProviders(): Promise<string[]> {
    const providers: string[] = []

    if (process.env.GROQ_API_KEY) {
      providers.push("groq")
    }

    if (process.env.TOGETHER_API_KEY) {
      providers.push("together")
    }

    return providers
  }
}

export const aiOrchestrator = new DrXAI()
export default DrXAI
