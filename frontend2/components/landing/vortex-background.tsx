"use client"

import { useEffect, useRef } from "react"

export function VortexBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    let particles: Array<{
      x: number
      y: number
      radius: number
      angle: number
      distance: number
      speed: number
      opacity: number
    }> = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initParticles()
    }

    const initParticles = () => {
      particles = []
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const maxDistance = Math.max(canvas.width, canvas.height) * 0.8

      for (let i = 0; i < 300; i++) {
        particles.push({
          x: 0,
          y: 0,
          radius: Math.random() * 2 + 0.5,
          angle: Math.random() * Math.PI * 2,
          distance: Math.random() * maxDistance,
          speed: 0.0005 + Math.random() * 0.001,
          opacity: Math.random() * 0.8 + 0.2,
        })
      }
    }

    const draw = () => {
      ctx.fillStyle = "rgba(3, 5, 15, 0.1)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      // Draw vortex gradient
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        Math.max(canvas.width, canvas.height) * 0.6
      )
      gradient.addColorStop(0, "rgba(59, 130, 246, 0.15)")
      gradient.addColorStop(0.3, "rgba(37, 99, 235, 0.08)")
      gradient.addColorStop(0.6, "rgba(29, 78, 216, 0.04)")
      gradient.addColorStop(1, "rgba(3, 5, 15, 0)")

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw particles
      particles.forEach((particle) => {
        particle.angle -= particle.speed
        particle.x = centerX + Math.cos(particle.angle) * particle.distance
        particle.y = centerY + Math.sin(particle.angle) * particle.distance

        const distanceRatio = particle.distance / (Math.max(canvas.width, canvas.height) * 0.8)
        const blue = Math.floor(180 + distanceRatio * 75)
        const green = Math.floor(100 + distanceRatio * 50)

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${green}, ${blue}, 255, ${particle.opacity * (1 - distanceRatio * 0.5)})`
        ctx.fill()

        // Add glow effect for some particles
        if (particle.radius > 1.5) {
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.radius * 3, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(59, 130, 246, ${particle.opacity * 0.1})`
          ctx.fill()
        }
      })

      // Draw spiral lines
      ctx.strokeStyle = "rgba(59, 130, 246, 0.03)"
      ctx.lineWidth = 1
      for (let i = 0; i < 8; i++) {
        ctx.beginPath()
        const startAngle = (i * Math.PI) / 4 + Date.now() * 0.00005
        for (let d = 0; d < Math.max(canvas.width, canvas.height) * 0.7; d += 5) {
          const angle = startAngle + d * 0.003
          const x = centerX + Math.cos(angle) * d
          const y = centerY + Math.sin(angle) * d
          if (d === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.stroke()
      }

      animationId = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener("resize", resize)
    draw()

    return () => {
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      suppressHydrationWarning
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: "linear-gradient(135deg, #030510 0%, #0a0a1a 50%, #050815 100%)" }}
    />
  )
}
