"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, UserIcon, Loader2, Trash2, Home, Sparkles } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MarkdownRenderer } from "@/components/markdown-renderer"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  model?: string
}

interface ChatUser {
  id: string
  name?: string
  avatar?: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<ChatUser | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me")
      const data = await response.json()

      if (!data.success) {
        router.push("/auth")
        return
      }

      setUser(data.user)
    } catch (error) {
      console.error("Auth check error:", error)
      router.push("/auth")
    } finally {
      setIsAuthLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const sendMessage = async () => {
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

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          conversationId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
          model: data.model,
        }

        setMessages((prev) => [...prev, assistantMessage])

        if (data.conversationId) {
          setConversationId(data.conversationId)
        }
      } else {
        throw new Error(data.message || "Failed to get response")
      }
    } catch (error) {
      console.error("Send message error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "عذراً، حدث خطأ أثناء معالجة رسالتك. يرجى المحاولة مرة أخرى.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    setConversationId(null)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-black flex items-center justify-center">
        <div className="text-white flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          جاري التحميل...
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-black flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent"
              >
                عبد العزيز الحمداني
              </Link>
              <Badge className="bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-300 border-red-500/30">
                <Bot className="w-3 h-3 ml-1" />
                مساعد ذكي
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 bg-transparent">
                  <Home className="w-4 h-4 ml-2" />
                  لوحة التحكم
                </Button>
              </Link>
              <Button
                onClick={clearChat}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 bg-transparent"
              >
                <Trash2 className="w-4 h-4 ml-2" />
                مسح المحادثة
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Messages */}
        <Card className="flex-1 bg-white/5 backdrop-blur-sm border-white/10 mb-4">
          <CardContent className="p-0 h-full">
            <ScrollArea className="h-[calc(100vh-200px)] p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">مرحباً {user.name || "بك"}!</h3>
                    <p className="text-gray-400 max-w-md">
                      أنا مساعدك الذكي. يمكنني مساعدتك في الإجابة على أسئلتك، حل المشاكل، أو مجرد الدردشة. اسأل أي شيء
                      تريد!
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Button
                      onClick={() => setInput("ما هو الذكاء الاصطناعي؟")}
                      variant="outline"
                      size="sm"
                      className="border-white/30 text-white hover:bg-white/10 bg-transparent"
                    >
                      ما هو الذكاء الاصطناعي؟
                    </Button>
                    <Button
                      onClick={() => setInput("كيف يمكنني تعلم البرمجة؟")}
                      variant="outline"
                      size="sm"
                      className="border-white/30 text-white hover:bg-white/10 bg-transparent"
                    >
                      كيف أتعلم البرمجة؟
                    </Button>
                    <Button
                      onClick={() => setInput("اكتب لي قصيدة قصيرة")}
                      variant="outline"
                      size="sm"
                      className="border-white/30 text-white hover:bg-white/10 bg-transparent"
                    >
                      اكتب قصيدة
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.role === "assistant" && (
                        <Avatar className="w-8 h-8 mt-1">
                          <AvatarFallback className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm">
                            <Bot className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === "user"
                            ? "bg-gradient-to-r from-red-600 to-orange-500 text-white"
                            : "bg-white/10 text-white border border-white/20"
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
                          {message.model && (
                            <Badge className="bg-white/20 text-white border-0 text-xs">{message.model}</Badge>
                          )}
                        </div>
                      </div>

                      {message.role === "user" && (
                        <Avatar className="w-8 h-8 mt-1">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm">
                            <UserIcon className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <Avatar className="w-8 h-8 mt-1">
                        <AvatarFallback className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm">
                          <Bot className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-white/10 text-white border border-white/20 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>جاري الكتابة...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Input */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="اكتب رسالتك هنا..."
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                disabled={isLoading}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
              <span>اضغط Enter للإرسال</span>
              <span>{input.length}/2000</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
