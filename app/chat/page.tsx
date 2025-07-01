"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Send, Bot, User, Loader2, MessageSquare, Sparkles, Trash2 } from "lucide-react"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { TypingIndicator } from "@/components/typing-indicator"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  model?: string
  tokens?: number
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  model: string
  createdAt: Date
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string>("")
  const [selectedModel, setSelectedModel] = useState("groq")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const availableModels = [
    { id: "groq", name: "Groq (Fast)", description: "Lightning fast responses" },
    { id: "together", name: "Together AI", description: "High quality responses" },
  ]

  useEffect(() => {
    // Generate session ID on mount
    setSessionId(`chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)

    // Load existing messages if any
    loadChatHistory()

    // Focus input on mount
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadChatHistory = async () => {
    try {
      // In a real app, you'd load from your backend
      const savedMessages = localStorage.getItem(`chat-${sessionId}`)
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages))
      }
    } catch (error) {
      console.error("Error loading chat history:", error)
    }
  }

  const saveChatHistory = (newMessages: Message[]) => {
    try {
      localStorage.setItem(`chat-${sessionId}`, JSON.stringify(newMessages))
    } catch (error) {
      console.error("Error saving chat history:", error)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")
    setIsLoading(true)
    setIsTyping(true)
    setError(null)

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          model: selectedModel,
          sessionId,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("No response body")
      }

      let assistantContent = ""
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        model: selectedModel,
      }

      const updatedMessages = [...newMessages, assistantMessage]
      setMessages(updatedMessages)
      setIsTyping(false)

      // Read the stream
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                assistantContent += parsed.content

                // Update the assistant message
                setMessages((prev) => {
                  const updated = [...prev]
                  const lastMessage = updated[updated.length - 1]
                  if (lastMessage.role === "assistant") {
                    lastMessage.content = assistantContent
                  }
                  return updated
                })
              }
            } catch (parseError) {
              console.error("Error parsing streaming response:", parseError)
            }
          }
        }
      }

      // Save final messages
      const finalMessages = [...newMessages, { ...assistantMessage, content: assistantContent }]
      setMessages(finalMessages)
      saveChatHistory(finalMessages)
    } catch (error) {
      console.error("Error sending message:", error)
      setError(error instanceof Error ? error.message : "Failed to send message")

      // Remove the user message if there was an error
      setMessages(messages)
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    setError(null)
    localStorage.removeItem(`chat-${sessionId}`)
    inputRef.current?.focus()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto max-w-4xl p-4 h-screen flex flex-col">
        {/* Header */}
        <Card className="mb-4 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-xl">
                <MessageSquare className="w-6 h-6 mr-2 text-blue-600" />
                DrX3 AI Chat
                <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Online
                </Badge>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white"
                  disabled={isLoading}
                >
                  {availableModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
                <Button variant="outline" size="sm" onClick={clearChat} disabled={isLoading || messages.length === 0}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {selectedModel && (
              <p className="text-sm text-gray-600 mt-1">
                Using {availableModels.find((m) => m.id === selectedModel)?.description}
              </p>
            )}
          </CardHeader>
        </Card>

        {/* Messages */}
        <Card className="flex-1 mb-4 bg-white/80 backdrop-blur-sm border-0 shadow-lg overflow-hidden">
          <CardContent className="p-0 h-full">
            <ScrollArea className="h-full p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <Bot className="w-16 h-16 text-blue-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Welcome to DrX3 AI Chat</h3>
                  <p className="text-gray-500 max-w-md">
                    Start a conversation with our AI assistant. Ask questions, get help with coding, or just have a
                    friendly chat!
                  </p>
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg">
                    <Button
                      variant="outline"
                      className="text-left justify-start bg-transparent"
                      onClick={() => setInput("What can you help me with?")}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      What can you help me with?
                    </Button>
                    <Button
                      variant="outline"
                      className="text-left justify-start bg-transparent"
                      onClick={() => setInput("Explain quantum computing")}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Explain quantum computing
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start space-x-3 ${
                        message.role === "user" ? "flex-row-reverse space-x-reverse" : ""
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {message.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={`flex-1 max-w-3xl ${message.role === "user" ? "text-right" : "text-left"}`}>
                        <div
                          className={`inline-block p-3 rounded-lg ${
                            message.role === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          {message.role === "assistant" ? (
                            <MarkdownRenderer content={message.content} />
                          ) : (
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          )}
                        </div>
                        <div
                          className={`text-xs text-gray-500 mt-1 ${
                            message.role === "user" ? "text-right" : "text-left"
                          }`}
                        >
                          {formatTime(message.timestamp)}
                          {message.model && <span className="ml-2">• {message.model}</span>}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="inline-block p-3 rounded-lg bg-gray-100">
                          <TypingIndicator />
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

        {/* Error Alert */}
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
              <Button variant="link" size="sm" onClick={() => setError(null)} className="ml-2 text-red-600 p-0 h-auto">
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Input */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex space-x-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={isLoading || !input.trim()} size="icon">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <span>{messages.length} messages</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
