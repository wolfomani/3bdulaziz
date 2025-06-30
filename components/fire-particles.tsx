"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"

interface FireParticle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
}

interface FireParticlesProps {
  isActive?: boolean
  intensity?: number
  containerRef?: React.RefObject<HTMLElement>
}

export function FireParticles({ isActive = false, intensity = 10, containerRef }: FireParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const particlesRef = useRef<FireParticle[]>([])
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  useEffect(() => {
    if (!isMounted || !isActive) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const container = containerRef?.current || canvas.parentElement
    if (!container) return

    // تحديد حجم الكانفاس
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // ألوان النار
    const fireColors = [
      "#ff0000", // أحمر
      "#ff4500", // برتقالي أحمر
      "#ff6600", // برتقالي
      "#ff8800", // برتقالي ذهبي
      "#ffaa00", // ذهبي
      "#ffcc00", // أصفر ذهبي
    ]

    // إنشاء جسيم نار جديد
    const createParticle = (): FireParticle => {
      const maxLife = 60 + Math.random() * 60
      return {
        x: Math.random() * canvas.width,
        y: canvas.height + 10,
        vx: (Math.random() - 0.5) * 2,
        vy: -2 - Math.random() * 3,
        life: maxLife,
        maxLife,
        size: 2 + Math.random() * 4,
        color: fireColors[Math.floor(Math.random() * fireColors.length)],
      }
    }

    // تحديث الجسيمات
    const updateParticles = () => {
      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.x += particle.vx
        particle.y += particle.vy
        particle.life--

        // تأثير الجاذبية والرياح
        particle.vy += 0.05
        particle.vx += (Math.random() - 0.5) * 0.1

        return particle.life > 0 && particle.y > -10
      })

      // إضافة جسيمات جديدة
      while (particlesRef.current.length < intensity) {
        particlesRef.current.push(createParticle())
      }
    }

    // رسم الجسيمات
    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particlesRef.current.forEach((particle) => {
        const alpha = particle.life / particle.maxLife
        const size = particle.size * alpha

        ctx.save()
        ctx.globalAlpha = alpha * 0.8
        ctx.fillStyle = particle.color

        // رسم الجسيم كدائرة متوهجة
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2)
        ctx.fill()

        // إضافة توهج
        ctx.globalAlpha = alpha * 0.3
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, size * 2, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()
      })
    }

    // حلقة الرسوم المتحركة
    const animate = () => {
      updateParticles()
      drawParticles()
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isMounted, isActive, intensity, containerRef])

  if (!isMounted) {
    return null
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      style={{
        mixBlendMode: "screen",
      }}
    />
  )
}

// Default export for backward compatibility
export default FireParticles
