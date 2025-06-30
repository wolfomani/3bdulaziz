"use client"

import { useEffect, useState } from "react"

interface TypingIndicatorProps {
  visible: boolean
  message?: string
}

export function TypingIndicator({ visible, message = "Dr X يفكر..." }: TypingIndicatorProps) {
  const [dots, setDots] = useState("")
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!visible || !isMounted) {
      setDots("")
      return
    }

    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return ""
        return prev + "."
      })
    }, 500)

    return () => clearInterval(interval)
  }, [visible, isMounted])

  if (!visible || !isMounted) return null

  return (
    <div className="flex items-center justify-center py-4 px-6">
      <div className="flex items-center gap-3 bg-gradient-to-r from-red-900/20 to-orange-900/20 backdrop-blur-sm border border-red-500/20 rounded-2xl px-4 py-3">
        {/* أيقونة النار المتحركة */}
        <div className="relative">
          <div className="w-6 h-6 relative">
            {/* النار الأساسية */}
            <div className="absolute inset-0 bg-gradient-to-t from-red-500 via-orange-500 to-yellow-400 rounded-full animate-pulse" />

            {/* جسيمات النار */}
            <div
              className="absolute -top-1 left-1 w-2 h-2 bg-orange-400 rounded-full animate-bounce"
              style={{ animationDelay: "0s", animationDuration: "1s" }}
            />
            <div
              className="absolute -top-1 right-1 w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.3s", animationDuration: "1.2s" }}
            />
            <div
              className="absolute top-0 left-1/2 w-1 h-1 bg-yellow-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.6s", animationDuration: "0.8s" }}
            />
          </div>
        </div>

        {/* النص مع النقاط المتحركة */}
        <div className="flex items-center gap-1">
          <span className="text-orange-200 font-medium text-sm">{message}</span>
          <span className="text-orange-400 font-bold text-lg w-6 text-left">{dots}</span>
        </div>

        {/* مؤشر الموجة */}
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-red-500 to-orange-400 rounded-full animate-pulse"
              style={{
                height: "12px",
                animationDelay: `${i * 0.2}s`,
                animationDuration: "1s",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Default export for backward compatibility
export default TypingIndicator
