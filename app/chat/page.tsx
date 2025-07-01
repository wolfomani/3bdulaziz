"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { MessageBubble } from "@/components/message-bubble"
import {
  User,
  Settings,
  Bot,
  Send,
  Lightbulb,
  Search,
  Code,
  Brain,
  Sparkles,
  Crown,
  Cpu,
  Database,
  Zap,
  X,
  ImageIcon,
  File,
  Mic,
  Video,
  Calculator,
  Eye,
  Network,
} from "lucide-react"
import NextLink from "next/link"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  model?: string
  tokens?: number
  processingTime?: number
}

interface ChatSettings {
  model: "together" | "groq"
  temperature: number
  maxTokens: number
  enableThinking: boolean
  enableSearch: boolean
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [genesisMode, setGenesisMode] = useState(false)
  const [settings, setSettings] = useState<ChatSettings>({
    model: "together",
    temperature: 0.7,
    maxTokens: 4000,
    enableThinking: false,
    enableSearch: false,
  })

  const [systemLoad, setSystemLoad] = useState({
    cpu: 45,
    memory: 62,
    gpu: 78,
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const interval = setInterval(() => {
      setSystemLoad({
        cpu: Math.floor(Math.random() * 40) + 30,
        memory: Math.floor(Math.random() * 30) + 50,
        gpu: Math.floor(Math.random() * 20) + 70,
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input.trim(),
          settings,
          history: messages.slice(-10),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        timestamp: new Date(),
        model: data.model,
        tokens: data.tokens,
        processingTime: data.processingTime,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "عذراً، حدث خطأ في النظام. يرجى المحاولة مرة أخرى.",
        timestamp: new Date(),
        model: "error",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [input])

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const handleRegenerateMessage = (messageIndex: number) => {
    const userMessage = messages[messageIndex - 1]
    if (userMessage && userMessage.role === "user") {
      setInput(userMessage.content)
      setMessages((prev) => prev.slice(0, messageIndex))
    }
  }

  const quickActions = [
    { icon: Lightbulb, label: "شرح مفهوم", prompt: "اشرح لي مفهوم" },
    { icon: Search, label: "بحث", prompt: "ابحث لي عن" },
    { icon: Bot, label: "مساعدة", prompt: "ساعدني في" },
    { icon: Code, label: "برمجة", prompt: "اكتب لي كود" },
  ]

  return (
    <div className="min-h-screen bg-black text-white font-sans" dir="rtl">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="mx-auto w-full px-4 lg:px-6 xl:max-w-7xl">
          <nav className="flex items-center justify-between gap-4 py-4">
            <NextLink href="/" className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg bg-gradient-to-r from-red-600 to-orange-500">
                  d3
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-500 rounded-xl blur opacity-30 animate-pulse"></div>
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                  drx3
                </span>
                <div className="text-xs text-gray-400">AI Platform v3.0</div>
              </div>
            </NextLink>

            {/* System Status */}
            <div className="hidden md:flex items-center gap-3 text-xs">
              <div className="flex items-center gap-2 bg-gray-800/50 rounded-full px-3 py-1">
                <Cpu className="w-3 h-3 text-blue-400" />
                <span>CPU: {systemLoad.cpu}%</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-800/50 rounded-full px-3 py-1">
                <Database className="w-3 h-3 text-green-400" />
                <span>RAM: {systemLoad.memory}%</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-800/50 rounded-full px-3 py-1">
                <Zap className="w-3 h-3 text-yellow-400" />
                <span>GPU: {systemLoad.gpu}%</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs">
                {settings.model === "together" ? "Together AI" : "Groq"}
              </Badge>

              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 rounded-full"
                onClick={() => setGenesisMode(!genesisMode)}
              >
                {genesisMode ? <Crown className="h-5 w-5 text-pink-400" /> : <Sparkles className="h-5 w-5" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 rounded-full"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-5 w-5" />
              </Button>

              <Button
                variant="default"
                className="text-white hover:opacity-90 rounded-full px-6 py-2 shadow-lg bg-gradient-to-r from-red-600 to-orange-500"
              >
                <User className="h-4 w-4 ml-2" />
                الدخول
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col h-screen pt-20">
        {messages.length === 0 ? (
          /* Welcome Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-8">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="text-6xl font-bold mb-4 bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                  drx3
                </div>
                <div className="text-lg text-gray-300 max-w-2xl">
                  مساعدك الذكي المتقدم جاهز لمساعدتك في أي شيء تحتاجه
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-20 border-white/20 backdrop-blur-sm hover:bg-white/10 rounded-2xl flex flex-col gap-2 transition-all hover:scale-105 bg-transparent"
                  onClick={() => setInput(action.prompt + " ")}
                >
                  <action.icon className="w-6 h-6 text-orange-400" />
                  <span className="text-sm font-medium">{action.label}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          /* Chat Messages */
          <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-5xl mx-auto w-full">
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                isGenesisMode={genesisMode}
                onCopy={handleCopyMessage}
                onRegenerate={() => handleRegenerateMessage(index)}
                onFeedback={(type) => console.log(`Feedback: ${type} for message ${message.id}`)}
              />
            ))}

            {isLoading && (
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-r from-red-600 to-orange-500">
                  <Bot className="w-6 h-6 animate-pulse" />
                </div>
                <div className="bg-gradient-to-br from-red-900/20 to-orange-900/20 backdrop-blur-sm border border-red-500/30 p-6 rounded-3xl">
                  <div className="flex items-center gap-2 mb-2 text-orange-400">
                    <Cpu className="w-4 h-4 animate-spin" />
                    <span className="text-sm">جاري المعالجة...</span>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-white/10 bg-black/50 backdrop-blur-xl p-6">
          <div className="max-w-5xl mx-auto">
            {/* Feature Toggles */}
            <div className="flex gap-3 mb-4 justify-center flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className={`border-white/25 hover:bg-white/10 rounded-full transition-all ${
                  settings.enableSearch
                    ? "bg-gradient-to-r from-red-600 to-orange-500 border-transparent shadow-lg"
                    : "bg-transparent"
                }`}
                onClick={() => setSettings((prev) => ({ ...prev, enableSearch: !prev.enableSearch }))}
              >
                <Search className="w-4 h-4 ml-2" />
                البحث العميق
              </Button>

              <Button
                variant="outline"
                size="sm"
                className={`border-white/25 hover:bg-white/10 rounded-full transition-all ${
                  settings.enableThinking
                    ? "bg-gradient-to-r from-purple-600 to-pink-500 border-transparent shadow-lg"
                    : "bg-transparent"
                }`}
                onClick={() => setSettings((prev) => ({ ...prev, enableThinking: !prev.enableThinking }))}
              >
                <Brain className="w-4 h-4 ml-2" />
                التفكير المتقدم
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="border-white/25 hover:bg-white/10 bg-gradient-to-r from-blue-600 to-cyan-500 border-transparent rounded-full shadow-lg"
              >
                <Eye className="w-4 h-4 ml-2" />
                الرؤية الحاسوبية
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="border-white/25 hover:bg-white/10 bg-gradient-to-r from-green-600 to-emerald-500 border-transparent rounded-full shadow-lg"
              >
                <Network className="w-4 h-4 ml-2" />
                RAG محسن
              </Button>
            </div>

            {/* Input Container */}
            <div className="relative bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-3xl border border-white/20 p-4 shadow-2xl">
              <div className="flex gap-2 mb-3">
                {[
                  { icon: ImageIcon, tooltip: "تحليل الصور" },
                  { icon: File, tooltip: "معالجة المستندات" },
                  { icon: Mic, tooltip: "التعرف على الصوت" },
                  { icon: Video, tooltip: "تحليل الفيديو" },
                  { icon: Code, tooltip: "مساعد البرمجة" },
                  { icon: Calculator, tooltip: "العمليات الحسابية" },
                ].map((tool, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all group"
                    title={tool.tooltip}
                  >
                    <tool.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </Button>
                ))}
              </div>

              <div className="flex items-end gap-4">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="ماذا تريد أن تستكشف اليوم؟"
                  className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none min-h-[60px] max-h-[120px] py-3 px-4 border-0"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                  className="rounded-full p-3 h-12 w-12 flex-shrink-0 transition-all hover:scale-105 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-white/20 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="border-b border-white/10 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                إعدادات النظام
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
                onClick={() => setShowSettings(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="overflow-y-auto max-h-[70vh] p-6 space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-4">نموذج الذكاء الاصطناعي</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={settings.model === "together" ? "default" : "outline"}
                    className="p-4 h-auto flex flex-col gap-2"
                    onClick={() => setSettings((prev) => ({ ...prev, model: "together" }))}
                  >
                    <span className="font-bold">Together AI</span>
                    <span className="text-xs text-gray-400">DeepSeek-R1-Distill</span>
                  </Button>
                  <Button
                    variant={settings.model === "groq" ? "default" : "outline"}
                    className="p-4 h-auto flex flex-col gap-2"
                    onClick={() => setSettings((prev) => ({ ...prev, model: "groq" }))}
                  >
                    <span className="font-bold">Groq</span>
                    <span className="text-xs text-gray-400">Qwen-QwQ-32B</span>
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-4">الإعدادات المتقدمة</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">مستوى الإبداع: {settings.temperature}</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={settings.temperature}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, temperature: Number.parseFloat(e.target.value) }))
                      }
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">الحد الأقصى للكلمات: {settings.maxTokens}</label>
                    <input
                      type="range"
                      min="500"
                      max="8000"
                      step="500"
                      value={settings.maxTokens}
                      onChange={(e) => setSettings((prev) => ({ ...prev, maxTokens: Number.parseInt(e.target.value) }))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 p-6 flex justify-end gap-3">
              <Button
                variant="outline"
                className="rounded-full px-6 py-2 bg-transparent"
                onClick={() => setShowSettings(false)}
              >
                إلغاء
              </Button>
              <Button
                variant="default"
                className="hover:opacity-90 rounded-full px-6 py-2 bg-gradient-to-r from-red-600 to-orange-500"
                onClick={() => setShowSettings(false)}
              >
                حفظ الإعدادات
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
