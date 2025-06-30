"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { useState, useRef, useEffect } from "react"
import { Newspaper, User, ImageIcon, Zap, Lightbulb, ArrowUp, Settings, X, File, Mic } from "lucide-react"
import Link from "next/link"

interface Message {
  id: number
  text: string
  sender: "user" | "ai"
  timestamp: Date
}

export default function ChatPage() {
  const [query, setQuery] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [deepSearchEnabled, setDeepSearchEnabled] = useState(false)
  const [thinkEnabled, setThinkEnabled] = useState(true)
  const [showWelcome, setShowWelcome] = useState(true)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!query.trim()) return

    const newMessage: Message = {
      id: Date.now(),
      text: query,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
    setQuery("")
    setIsLoading(true)
    setShowWelcome(false)

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "مرحباً! أنا drx3، مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟",
        "هذا سؤال ممتاز! دعني أبحث عن أفضل إجابة لك...",
        "بناءً على تحليلي للمعلومات المتاحة، يمكنني أن أقول...",
        "شكراً لسؤالك. إليك ما وجدته حول هذا الموضوع...",
        "لقد قمت بمعالجة طلبك وهذه النتائج التي توصلت إليها...",
      ]

      const aiMessage: Message = {
        id: Date.now() + 1,
        text: responses[Math.floor(Math.random() * responses.length)],
        sender: "ai",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
      setIsLoading(false)
    }, 1500)
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
  }, [query])

  const quickActions = [
    { icon: ImageIcon, label: "تعديل الصورة", disabled: true },
    { icon: Newspaper, label: "آخر الأخبار" },
    { icon: User, label: "شخصيات" },
    { icon: File, label: "تحليل المستندات", disabled: true },
  ]

  return (
    <div className="min-h-screen bg-black text-white font-body" dir="rtl">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10">
        <div className="mx-auto w-full px-4 lg:px-6 xl:max-w-7xl relative">
          <nav className="flex items-center justify-between gap-4 py-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-red-600 to-orange-500 w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold">
                d3
              </div>
              <span className="text-xl font-bold gradient-text">drx3</span>
            </Link>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 rounded-full"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button
                variant="default"
                className="bg-gradient-to-r from-red-600 to-orange-500 text-white hover:opacity-90 rounded-full px-4 py-2"
              >
                <User className="h-4 w-4 ml-2" />
                تسجيل الدخول
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col h-screen pt-20">
        {showWelcome && messages.length === 0 ? (
          /* Welcome Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-8">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="text-6xl font-bold gradient-text animate-float mb-4">drx3</div>
                <div className="absolute -inset-4 bg-gradient-to-r from-red-600/20 to-orange-500/20 rounded-full blur-xl animate-pulse" />
              </div>
              <p className="text-xl text-gray-300 max-w-md">مساعدك الذكي المتقدم جاهز لمساعدتك في أي شيء تحتاجه</p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className={`border-white/25 text-white hover:bg-white/10 bg-transparent rounded-full px-4 py-2 ${
                    action.disabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={action.disabled}
                >
                  <action.icon className="w-4 h-4 ml-2" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          /* Chat Messages */
          <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-4xl mx-auto w-full">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.sender === "user" ? "flex-row-reverse" : "flex-row"} animate-fade-in-up`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    message.sender === "user"
                      ? "bg-gradient-to-r from-gray-600 to-gray-700"
                      : "bg-gradient-to-r from-red-600 to-orange-500 animate-glow"
                  }`}
                >
                  {message.sender === "user" ? "أ" : "d3"}
                </div>
                <div
                  className={`max-w-[70%] p-4 rounded-2xl ${
                    message.sender === "user"
                      ? "bg-white/10 backdrop-blur-sm border border-white/20"
                      : "bg-gradient-to-r from-red-900/30 to-orange-900/30 backdrop-blur-sm border border-red-500/30"
                  }`}
                >
                  <p className="text-white leading-relaxed">{message.text}</p>
                  <div className="text-xs text-gray-400 mt-2">
                    {message.timestamp.toLocaleTimeString("ar-SA", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 animate-fade-in-up">
                <div className="bg-gradient-to-r from-red-600 to-orange-500 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold animate-glow">
                  d3
                </div>
                <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 backdrop-blur-sm border border-red-500/30 p-4 rounded-2xl">
                  <div className="loading-dots text-orange-400">
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-white/10 bg-black/50 backdrop-blur-sm p-4">
          <div className="max-w-4xl mx-auto">
            {/* Feature Toggles */}
            <div className="flex gap-2 mb-3 justify-center">
              <Button
                variant="outline"
                size="sm"
                className={`border-white/25 hover:bg-white/10 rounded-full transition-all ${
                  deepSearchEnabled
                    ? "bg-gradient-to-r from-red-600 to-orange-500 border-transparent"
                    : "bg-transparent"
                }`}
                onClick={() => setDeepSearchEnabled(!deepSearchEnabled)}
              >
                <Zap className="w-4 h-4 ml-2" />
                DeepSearch
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`border-white/25 hover:bg-white/10 rounded-full transition-all ${
                  thinkEnabled ? "bg-gradient-to-r from-red-600 to-orange-500 border-transparent" : "bg-transparent"
                }`}
                onClick={() => setThinkEnabled(!thinkEnabled)}
              >
                <Lightbulb className="w-4 h-4 ml-2" />
                Think
              </Button>
            </div>

            {/* Input Container */}
            <div className="relative bg-gray-900/80 backdrop-blur-sm rounded-3xl border border-white/20 p-3">
              <div className="flex gap-2 mb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
                  disabled
                >
                  <ImageIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
                  disabled
                >
                  <File className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
                  disabled
                >
                  <Mic className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-end gap-3">
                <textarea
                  ref={textareaRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="ماذا تريد أن تعرف؟"
                  className="flex-1 bg-transparent text-white placeholder-gray-400 resize-none outline-none min-h-[44px] max-h-[120px] py-3 px-1"
                  rows={1}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!query.trim() || isLoading}
                  className={`rounded-full p-3 transition-all ${
                    query.trim() && !isLoading
                      ? "bg-gradient-to-r from-red-600 to-orange-500 hover:opacity-90"
                      : "bg-gray-700 cursor-not-allowed"
                  }`}
                >
                  <ArrowUp className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center mt-3">
              بإرسالك رسالة إلى drx3، فإنك توافق على{" "}
              <Link href="/terms" className="text-white hover:underline">
                الشروط
              </Link>{" "}
              و{" "}
              <Link href="/privacy" className="text-white hover:underline">
                سياسة الخصوصية
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-gray-900/95 backdrop-blur-md w-full max-w-md h-full p-6 border-l border-white/10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold">إعدادات المحادثة</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsOpen(false)}
                className="text-white hover:bg-white/10 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium mb-4">نموذج الذكاء الاصطناعي</h4>
                <div className="space-y-3">
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-red-500/50">
                    <div className="font-medium">drx3 الأساسي</div>
                    <div className="text-sm text-gray-400 mt-1">للأغراض العامة والمحادثات اليومية</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-white/20 hover:border-white/40 cursor-pointer transition-colors">
                    <div className="font-medium">drx3 المتقدم</div>
                    <div className="text-sm text-gray-400 mt-1">للأبحاث والتحليل المتقدم</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium mb-4">طرق التفكير</h4>
                <div className="flex flex-wrap gap-2">
                  {["إبداعي", "تحليلي", "عملي", "متوازن"].map((mode, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className={`border-white/25 hover:bg-white/10 rounded-full ${
                        index === 3
                          ? "bg-gradient-to-r from-red-600 to-orange-500 border-transparent"
                          : "bg-transparent"
                      }`}
                    >
                      {mode}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium mb-4">إعدادات إضافية</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-gray-800/50 rounded-xl p-4">
                    <span>البحث العميق</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={deepSearchEnabled}
                        onChange={(e) => setDeepSearchEnabled(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-red-600 peer-checked:to-orange-500"></div>
                    </label>
                  </div>

                  <div className="flex justify-between items-center bg-gray-800/50 rounded-xl p-4">
                    <span>وضع التفكير</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={thinkEnabled}
                        onChange={(e) => setThinkEnabled(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-red-600 peer-checked:to-orange-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
