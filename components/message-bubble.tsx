"use client"
import { User, Bot, Crown, Copy, ThumbsUp, ThumbsDown, RotateCcw, Clock, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MarkdownRenderer } from "./markdown-renderer"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  model?: string
  tokens?: number
  processingTime?: number
}

interface MessageBubbleProps {
  message: Message
  isGenesisMode?: boolean
  onCopy?: (content: string) => void
  onRegenerate?: () => void
  onFeedback?: (type: "up" | "down") => void
}

export function MessageBubble({
  message,
  isGenesisMode = false,
  onCopy,
  onRegenerate,
  onFeedback,
}: MessageBubbleProps) {
  const isUser = message.role === "user"

  return (
    <div className={`flex gap-4 ${isUser ? "flex-row-reverse" : "flex-row"} animate-fade-in-up`}>
      {/* Avatar */}
      <div
        className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold relative transition-all",
          isUser
            ? isGenesisMode
              ? "bg-gradient-to-r from-gray-600 to-gray-700 border border-pink-500/20"
              : "bg-gradient-to-r from-gray-600 to-gray-700"
            : isGenesisMode
              ? "bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-500 shadow-lg shadow-pink-500/25"
              : "bg-gradient-to-r from-red-600 to-orange-500",
        )}
      >
        {isUser ? (
          <User className="w-6 h-6 text-white" />
        ) : (
          <>
            {isGenesisMode ? (
              <Crown className="w-6 h-6 text-white animate-pulse" />
            ) : (
              <Bot className="w-6 h-6 text-white" />
            )}
            <div
              className={cn(
                "absolute -top-1 -right-1 w-3 h-3 rounded-full",
                isGenesisMode ? "bg-pink-400 animate-pulse" : "bg-green-400 animate-pulse",
              )}
            />
          </>
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          "max-w-[75%] rounded-3xl relative transition-all",
          isUser
            ? isGenesisMode
              ? "bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-pink-500/20 p-6"
              : "bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-white/20 p-6"
            : isGenesisMode
              ? "bg-gradient-to-br from-pink-900/10 to-purple-900/10 backdrop-blur-sm border border-pink-500/20 p-6"
              : "bg-gradient-to-br from-red-900/20 to-orange-900/20 backdrop-blur-sm border border-red-500/30 p-6",
        )}
      >
        {/* Message Text */}
        {isUser ? (
          <p className="text-white leading-relaxed mb-3">{message.content}</p>
        ) : (
          <MarkdownRenderer content={message.content} className={isGenesisMode ? "genesis-text" : ""} />
        )}

        {/* Message Actions */}
        {!isUser && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{message.timestamp.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}</span>
              {message.model && (
                <>
                  <Cpu className="w-3 h-3 ml-2" />
                  <span>{message.model}</span>
                </>
              )}
              {message.tokens && <span className="ml-2">• {message.tokens} tokens</span>}
              {message.processingTime && <span>• {message.processingTime}ms</span>}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopy?.(message.content)}
                className="h-8 w-8 p-0 hover:bg-white/10"
                title="نسخ"
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRegenerate?.()}
                className="h-8 w-8 p-0 hover:bg-white/10"
                title="إعادة توليد"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFeedback?.("up")}
                className="h-8 w-8 p-0 hover:bg-white/10"
                title="إعجاب"
              >
                <ThumbsUp className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFeedback?.("down")}
                className="h-8 w-8 p-0 hover:bg-white/10"
                title="عدم إعجاب"
              >
                <ThumbsDown className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {isUser && (
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{message.timestamp.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        )}
      </div>
    </div>
  )
}
