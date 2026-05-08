"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState } from "react"
import { Quote, Star, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const testimonials = [
  {
    name: "Sarah Chen",
    role: "VP of Engineering",
    company: "TechFlow Inc.",
    avatar: "SC",
    rating: 5,
    content:
      "Cloud Cost Guard transformed how we manage our AWS infrastructure. The dashboard gives us clear, real-time visibility into costs and security posture.",
  },
  {
    name: "Marcus Williams",
    role: "DevOps Lead",
    company: "DataStream Corp",
    avatar: "MW",
    rating: 5,
    content:
      "The AI assistant is incredible. Instead of spending hours analyzing cost reports, I just ask questions and get actionable insights instantly. It's like having a cloud expert available 24/7.",
  },
  {
    name: "Emily Rodriguez",
    role: "Cloud Security Architect",
    company: "SecureNet Systems",
    avatar: "ER",
    rating: 5,
    content:
      "The security monitoring features caught vulnerabilities our previous tools missed. The real-time threat detection and automated remediation have been game-changers for our compliance efforts.",
  },
  {
    name: "James Kim",
    role: "CTO",
    company: "StartupX",
    avatar: "JK",
    rating: 5,
    content:
      "As a startup, every dollar counts. Cloud Cost Guard helped us pinpoint waste and prioritize the next best actions without guesswork.",
  },
  {
    name: "Lisa Thompson",
    role: "Infrastructure Manager",
    company: "Global Retail Co",
    avatar: "LT",
    rating: 5,
    content:
      "Managing multi-cloud environments was a nightmare before Cloud Cost Guard. Now we have unified visibility across AWS, Azure, and GCP with AI-powered recommendations that actually work.",
  },
  {
    name: "David Park",
    role: "Senior SRE",
    company: "FinTech Solutions",
    avatar: "DP",
    rating: 5,
    content:
      "The carbon tracking feature helped us align sustainability goals with infrastructure decisions using real telemetry from our cloud accounts.",
  },
]

export function TestimonialsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [currentIndex, setCurrentIndex] = useState(0)

  const visibleTestimonials = 3
  const maxIndex = testimonials.length - visibleTestimonials

  const next = () => setCurrentIndex((prev) => Math.min(prev + 1, maxIndex))
  const prev = () => setCurrentIndex((prev) => Math.max(prev - 1, 0))

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-medium tracking-wider uppercase">Testimonials</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-6 text-balance">
            Trusted by <span className="text-primary neon-text">Industry Leaders</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            See how enterprises around the world are transforming their cloud operations 
            with Cloud Cost Guard.
          </p>
        </motion.div>

        {/* Desktop Carousel */}
        <div className="hidden lg:block relative">
          <div className="flex gap-6 transition-transform duration-500" style={{ transform: `translateX(-${currentIndex * (100 / visibleTestimonials)}%)` }}>
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                className="flex-shrink-0 w-[calc(33.333%-16px)]"
              >
                <div className="glass-card rounded-2xl p-6 h-full hover:neon-glow transition-all group">
                  <Quote className="w-8 h-8 text-primary/30 mb-4" />
                  
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role}, {testimonial.company}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1 mt-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={prev}
              disabled={currentIndex === 0}
              className="rounded-full"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={next}
              disabled={currentIndex >= maxIndex}
              className="rounded-full"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Grid */}
        <div className="lg:hidden grid md:grid-cols-2 gap-6">
          {testimonials.slice(0, 4).map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className="glass-card rounded-2xl p-6"
            >
              <Quote className="w-6 h-6 text-primary/30 mb-3" />
              
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-sm font-semibold">
                  {testimonial.avatar}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm">{testimonial.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Company Logos */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-muted-foreground mb-6">Trusted by teams at</p>
          <div className="flex flex-wrap justify-center gap-8 opacity-50">
            {["TechFlow", "DataStream", "SecureNet", "StartupX", "Global Retail", "FinTech"].map(
              (company) => (
                <span key={company} className="text-lg font-semibold text-muted-foreground">
                  {company}
                </span>
              )
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
