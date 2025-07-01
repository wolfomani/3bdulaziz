import { groq } from "@ai-sdk/groq"
import { createOpenAI } from "@ai-sdk/openai"
import { cache } from "./redis-cache"

// Initialize providers with environment variables
const groqProvider = groq({
  apiKey: process.env.GROQ_API_KEY!,
})

const togetherProvider = createOpenAI({
  apiKey: process.env.TOGETHER_API_KEY!,
  baseURL: "https://api.together.xyz/v1",
})

export interface AIProvider {
  name: string
  models: string[]
  costPerToken: number
  maxTokens: number
  supportsStreaming: boolean
  isAvailable: boolean
}

export interface ModelConfig {
  provider: string
  model: string
  temperature?: number
  maxTokens?: number
  topP?: number
}

export interface AIResponse {
  content: string
  provider: string
  model: string
  tokensUsed: number
  cost: number
  confidence: number
  processingTime: number
  cached: boolean
}

// Enhanced provider configurations
export const AI_PROVIDERS: Record<string, AIProvider> = {
  groq: {
    name: "Groq",
    models: [
      "llama-3.1-70b-versatile",
      "llama-3.1-8b-instant",
      "mixtral-8x7b-32768",
      "gemma2-9b-it",
      "llama3-groq-70b-8192-tool-use-preview",
    ],
    costPerToken: 0.0000005,
    maxTokens: 32768,
    supportsStreaming: true,
    isAvailable: true,
  },
  together: {
    name: "Together AI",
    models: [
      "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
      "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
      "mistralai/Mixtral-8x7B-Instruct-v0.1",
      "NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO",
      "codellama/CodeLlama-34b-Instruct-hf",
    ],
    costPerToken: 0.0000008,
    maxTokens: 8192,
    supportsStreaming: true,
    isAvailable: true,
  },
}

// Smart model selection based on query analysis
export function analyzeQuery(query: string): {
  language: "ar" | "en" | "mixed"
  complexity: "simple" | "medium" | "complex"
  type: "chat" | "code" | "creative" | "analytical"
  sentiment: "positive" | "neutral" | "negative"
  topics: string[]
} {
  const arabicPattern = /[\u0600-\u06FF]/
  const codePattern = /```|function|class|import|export|const|let|var/i
  const creativePattern = /write|create|story|poem|creative|imagine/i
  const analyticalPattern = /analyze|compare|explain|why|how|what/i

  const hasArabic = arabicPattern.test(query)
  const hasEnglish = /[a-zA-Z]/.test(query)
  const hasCode = codePattern.test(query)
  const isCreative = creativePattern.test(query)
  const isAnalytical = analyticalPattern.test(query)

  return {
    language: hasArabic && hasEnglish ? "mixed" : hasArabic ? "ar" : "en",
    complexity: query.length > 200 ? "complex" : query.length > 50 ? "medium" : "simple",
    type: hasCode ? "code" : isCreative ? "creative" : isAnalytical ? "analytical" : "chat",
    sentiment: query.includes("!") || query.includes("?") ? "positive" : "neutral",
    topics: extractTopics(query),
  }
}

function extractTopics(query: string): string[] {
  const topics = []
  if (query.includes("AI") || query.includes("ذكاء")) topics.push("ai")
  if (query.includes("code") || query.includes("برمجة")) topics.push("programming")
  if (query.includes("help") || query.includes("مساعدة")) topics.push("help")
  return topics
}

export function selectOptimalModel(analysis: ReturnType<typeof analyzeQuery>): ModelConfig {
  // Arabic language preference
  if (analysis.language === "ar" || analysis.language === "mixed") {
    return {
      provider: "groq",
      model: "llama-3.1-70b-versatile",
      temperature: 0.7,
      maxTokens: 2048,
    }
  }

  // Code generation
  if (analysis.type === "code") {
    return {
      provider: "together",
      model: "codellama/CodeLlama-34b-Instruct-hf",
      temperature: 0.3,
      maxTokens: 4096,
    }
  }

  // Complex analytical tasks
  if (analysis.complexity === "complex" || analysis.type === "analytical") {
    return {
      provider: "groq",
      model: "llama-3.1-70b-versatile",
      temperature: 0.5,
      maxTokens: 4096,
    }
  }

  // Creative tasks
  if (analysis.type === "creative") {
    return {
      provider: "together",
      model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
      temperature: 0.9,
      maxTokens: 2048,
    }
  }

  // Default for simple chat
  return {
    provider: "groq",
    model: "llama-3.1-8b-instant",
    temperature: 0.7,
    maxTokens: 1024,
  }
}

// Rate limiting with Redis
export async function checkRateLimit(identifier: string): Promise<{
  allowed: boolean
  remaining: number
  resetTime: number
}> {
  return cache.checkRateLimit(identifier, 100, 3600) // 100 requests per hour
}

// Caching mechanism
export async function getCachedResponse(query: string): Promise<AIResponse | null> {
  const cacheKey = `ai_response:${Buffer.from(query).toString("base64")}`
  return cache.get<AIResponse>(cacheKey, "ai")
}

export async function setCachedResponse(query: string, response: AIResponse): Promise<void> {
  const cacheKey = `ai_response:${Buffer.from(query).toString("base64")}`
  await cache.set(cacheKey, response, { prefix: "ai", ttl: 1800 }) // 30 minutes
}

// Main AI generation function
export async function generateAIResponse(
  query: string,
  options: {
    userId?: string
    conversationId?: string
    systemPrompt?: string
    stream?: boolean
  } = {},
): Promise<AIResponse> {
  const startTime = Date.now()

  // Check rate limiting
  const rateLimitResult = await checkRateLimit(options.userId || "anonymous")
  if (!rateLimitResult.allowed) {
    throw new Error("Rate limit exceeded")
  }

  // Check cache first
  const cached = await getCachedResponse(query)
  if (cached) {
    return { ...cached, cached: true }
  }

  // Analyze query and select model
  const analysis = analyzeQuery(query)
  const modelConfig = selectOptimalModel(analysis)

  let response: AIResponse

  try {
    if (modelConfig.provider === "groq") {
      response = await generateGroqResponse(query, modelConfig, options)
    } else {
      response = await generateTogetherResponse(query, modelConfig, options)
    }

    response.processingTime = Date.now() - startTime
    response.cached = false

    // Cache successful responses
    await setCachedResponse(query, response)

    return response
  } catch (error) {
    console.error("AI generation error:", error)
    throw error
  }
}

async function generateGroqResponse(query: string, config: ModelConfig, options: any): Promise<AIResponse> {
  const model = groqProvider(config.model)

  const systemPrompt =
    options.systemPrompt ||
    `أنت مساعد ذكي متخصص في الذكاء الاصطناعي. تجيب باللغة العربية عندما يكون السؤال بالعربية، وبالإنجليزية عندما يكون بالإنجليزية. كن مفيداً ودقيقاً في إجاباتك.`

  const result = await model.generateText({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: query },
    ],
    temperature: config.temperature || 0.7,
    maxTokens: config.maxTokens || 2048,
  })

  return {
    content: result.text,
    provider: "groq",
    model: config.model,
    tokensUsed: result.usage?.totalTokens || 0,
    cost: (result.usage?.totalTokens || 0) * AI_PROVIDERS.groq.costPerToken,
    confidence: calculateConfidence(result.text),
    processingTime: 0,
    cached: false,
  }
}

async function generateTogetherResponse(query: string, config: ModelConfig, options: any): Promise<AIResponse> {
  const model = togetherProvider(config.model)

  const systemPrompt =
    options.systemPrompt ||
    `You are an intelligent AI assistant specialized in artificial intelligence. Answer in Arabic when the question is in Arabic, and in English when it's in English. Be helpful and accurate in your responses.`

  const result = await model.generateText({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: query },
    ],
    temperature: config.temperature || 0.7,
    maxTokens: config.maxTokens || 2048,
  })

  return {
    content: result.text,
    provider: "together",
    model: config.model,
    tokensUsed: result.usage?.totalTokens || 0,
    cost: (result.usage?.totalTokens || 0) * AI_PROVIDERS.together.costPerToken,
    confidence: calculateConfidence(result.text),
    processingTime: 0,
    cached: false,
  }
}

function calculateConfidence(text: string): number {
  // Simple confidence calculation based on response characteristics
  let confidence = 0.5

  if (text.length > 100) confidence += 0.2
  if (text.includes("لأن") || text.includes("because")) confidence += 0.1
  if (text.includes("مثال") || text.includes("example")) confidence += 0.1
  if (text.includes("؟") || text.includes("?")) confidence -= 0.1

  return Math.min(Math.max(confidence, 0), 1)
}

// Streaming support
export async function generateStreamingResponse(query: string, options: any = {}): Promise<ReadableStream> {
  const analysis = analyzeQuery(query)
  const modelConfig = selectOptimalModel(analysis)

  if (modelConfig.provider === "groq") {
    const model = groqProvider(modelConfig.model)
    const result = await model.generateText({
      messages: [
        { role: "system", content: options.systemPrompt || "أنت مساعد ذكي." },
        { role: "user", content: query },
      ],
      temperature: modelConfig.temperature || 0.7,
      maxTokens: modelConfig.maxTokens || 2048,
    })

    // Convert to stream (simplified)
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(result.text))
        controller.close()
      },
    })
  }

  throw new Error("Streaming not implemented for this provider")
}

// Health check for providers
export async function checkProvidersHealth(): Promise<Record<string, boolean>> {
  const health: Record<string, boolean> = {}

  try {
    // Test Groq
    const groqModel = groqProvider("llama-3.1-8b-instant")
    await groqModel.generateText({
      messages: [{ role: "user", content: "test" }],
      maxTokens: 10,
    })
    health.groq = true
  } catch {
    health.groq = false
  }

  try {
    // Test Together
    const togetherModel = togetherProvider("meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo")
    await togetherModel.generateText({
      messages: [{ role: "user", content: "test" }],
      maxTokens: 10,
    })
    health.together = true
  } catch {
    health.together = false
  }

  return health
}

// AI Orchestrator for managing multiple providers
export const aiOrchestrator = {
  async generateResponse(query: string, options: any = {}) {
    return generateAIResponse(query, options)
  },

  async streamResponse(query: string, options: any = {}) {
    return generateStreamingResponse(query, options)
  },

  async getProviderHealth() {
    return checkProvidersHealth()
  },

  analyzeQuery,
  selectOptimalModel,
  AI_PROVIDERS,
}
