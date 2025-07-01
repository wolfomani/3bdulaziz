"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Send, Bot, UserIcon, Loader2, ArrowLeft, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { TypingIndicator } from "@/components/typing-indicator"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  provider?: string
  model?: string
  tokensUsed?: number
}

interface ChatUser {
  id: string
  name: string
  avatar?: string
}

export default function ChatPage() {
  const router = useRouter()
  const [user, setUser] = useState<ChatUser | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me")
      const data = await response.json()

      if (data.authenticated) {
        setUser(data.user)
      } else {
        router.push("/auth")
      }
    } catch (error) {
      console.error("Auth check error:", error)
      router.push("/auth")
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setIsTyping(true)

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId: "current-chat", // In a real app, this would be dynamic
        }),
      })

      const data = await response.json()

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response.content,
          timestamp: new Date(),
          provider: data.response.provider,
          model: data.response.model,
          tokensUsed: data.response.tokensUsed,
        }

        setMessages((prev) => [...prev, assistantMessage])
      } else {
        toast.error(data.message || "حدث خطأ في الإرسال")
      }
    } catch (error) {
      console.error("Send message error:", error)
      toast.error("حدث خطأ في الاتصال")
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    toast.success("تم مسح المحادثة")
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <Button onClick={() => router.push("/dashboard")} variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                العودة
              </Button>
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <Bot className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">المساعد الذكي</h1>
                  <p className="text-sm text-gray-500">مدعوم بـ Groq و Together AI</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {messages.length} رسالة
              </Badge>
              <Button onClick={clearChat} variant="outline" size="sm">
                مسح المحادثة
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <Card className="h-[calc(100vh-200px)] flex flex-col">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">مرحباً {user.name}!</h3>
                  <p className="text-gray-500 max-w-md">
                    أنا مساعدك الذكي. يمكنني مساعدتك في الإجابة على أسئلتك، كتابة النصوص، البرمجة، والكثير من المهام
                    الأخرى. ما الذي تود معرفته؟
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-3 rtl:space-x-reverse ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          <Bot className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <MarkdownRenderer content={message.content} />
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}

                      <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                        <span>
                          {message.timestamp.toLocaleTimeString("ar-SA", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {message.provider && (
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <Badge variant="outline" className="text-xs">
                              {message.provider}
                            </Badge>
                            {message.tokensUsed && <span>{message.tokensUsed} رمز</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    {message.role === "user" && (
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                        <AvatarFallback className="bg-gray-100 text-gray-600">
                          <UserIcon className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-start space-x-3 rtl:space-x-reverse">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-gray-100 rounded-lg px-4 py-2">
                      <TypingIndicator />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          <Separator />

          {/* Input Form */}
          <form onSubmit={sendMessage} className="p-4">
            <div className="flex space-x-2 rtl:space-x-reverse">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اكتب رسالتك هنا..."
                disabled={isLoading}
                className="flex-1"
                maxLength={2000}
              />
              <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
              <span>{input.length}/2000</span>
              <span>اضغط Enter للإرسال</span>
            </div>
          </form>
        </Card>
      </main>
    </div>
  )
}
