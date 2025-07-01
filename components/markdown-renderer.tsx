"use client"
import { cn } from "@/lib/utils"

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  // تحويل النص إلى HTML منسق
  const formatContent = (text: string) => {
    let formatted = text

    // العناوين
    formatted = formatted.replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold text-white mb-3 mt-4">$1</h3>')
    formatted = formatted.replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-white mb-4 mt-5">$1</h2>')
    formatted = formatted.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-white mb-4 mt-6">$1</h1>')

    // النص الغامق
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
    formatted = formatted.replace(/__(.*?)__/g, '<strong class="font-bold text-white">$1</strong>')

    // النص المائل
    formatted = formatted.replace(/\*(.*?)\*/g, '<em class="italic text-gray-300">$1</em>')
    formatted = formatted.replace(/_(.*?)_/g, '<em class="italic text-gray-300">$1</em>')

    // الكود المضمن
    formatted = formatted.replace(
      /`([^`]+)`/g,
      '<code class="bg-gray-800 text-orange-400 px-2 py-1 rounded text-sm font-mono">$1</code>',
    )

    // الروابط
    formatted = formatted.replace(
      /\[([^\]]+)\]$$([^)]+)$$/g,
      '<a href="$2" class="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">$1</a>',
    )

    // القوائم المرقمة
    formatted = formatted.replace(/^\d+\.\s+(.*)$/gm, '<li class="mb-2 text-gray-200">$1</li>')

    // القوائم النقطية
    formatted = formatted.replace(/^[*\-+]\s+(.*)$/gm, '<li class="mb-2 text-gray-200 list-disc ml-4">$1</li>')

    // تجميع القوائم
    formatted = formatted.replace(/(<li[^>]*>.*<\/li>\s*)+/gs, (match) => {
      if (match.includes("list-disc")) {
        return `<ul class="mb-4 space-y-1">${match}</ul>`
      } else {
        return `<ol class="mb-4 space-y-1 list-decimal list-inside">${match}</ol>`
      }
    })

    // الفقرات
    const lines = formatted.split("\n")
    const processedLines = lines.map((line) => {
      const trimmed = line.trim()
      if (!trimmed) return "<br>"
      if (
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<ol") ||
        trimmed.startsWith("<li") ||
        trimmed.startsWith("<code") ||
        trimmed.startsWith("<pre")
      ) {
        return trimmed
      }
      return `<p class="mb-3 text-gray-200 leading-relaxed">${trimmed}</p>`
    })

    formatted = processedLines.join("\n")

    // كتل الكود
    formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<div class="my-4">
        ${lang ? `<div class="bg-gray-800 text-gray-400 px-4 py-2 text-sm font-mono border-b border-gray-700">${lang}</div>` : ""}
        <pre class="bg-gray-900 text-gray-200 p-4 rounded-b-lg overflow-x-auto"><code class="font-mono text-sm">${code.trim()}</code></pre>
      </div>`
    })

    return formatted
  }

  return (
    <div
      className={cn("prose prose-invert max-w-none", className)}
      dangerouslySetInnerHTML={{ __html: formatContent(content) }}
    />
  )
}
