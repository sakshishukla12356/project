"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bot, User, Send, Sparkles, TrendingDown, Shield, Server, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { chatbotApi } from "@/src/services/chatbotApi"

const suggestedPrompts = [
  { icon: TrendingDown, text: "Why is my AWS bill high this month?" },
  { icon: Shield, text: "What are my top security risks?" },
  { icon: Server, text: "Show me idle EC2 instances" },
  { icon: Sparkles, text: "How can I reduce cloud costs?" },
]

interface Message {
  role: "user" | "assistant"
  content: string
}

const initialMessages: Message[] = [
  {
    role: "assistant",
    content: "Hello! I'm your Cloud Cost Guard AI assistant. I can help you analyze cloud costs, identify optimization opportunities, and answer questions about your infrastructure. What would you like to know?",
  },
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const result = await chatbotApi.chat(userMessage.content)
      const payload = result.response
      const insights = (payload.insights || []).slice(0, 8)
      const text = [payload.message, ...insights.map((i) => `- ${i}`), payload.note ? `\n${payload.note}` : ""]
        .filter(Boolean)
        .join("\n")
      setMessages((prev) => [...prev, { role: "assistant", content: text }])
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Unable to fetch cloud telemetry. ${e instanceof Error ? e.message : ""}`.trim() },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-[calc(100vh-3rem)] flex gap-6">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <h1 className="text-2xl font-bold text-foreground">AI Assistant</h1>
          <p className="text-muted-foreground">Ask questions about your cloud infrastructure</p>
        </motion.div>

        <Card className="flex-1 glass-card border-border flex flex-col">
          {/* Chat Header */}
          <CardHeader className="border-b border-border py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-base text-foreground">CloudGuard AI</CardTitle>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              </div>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence mode="popLayout">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "glass rounded-bl-sm"
                    }`}
                  >
                    <p className={`text-sm whitespace-pre-line ${message.role === "assistant" ? "text-foreground" : ""}`}>
                      {message.content}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-secondary-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="glass rounded-2xl rounded-bl-sm p-4">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                placeholder="Ask about your cloud resources..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="bg-muted/50 border-border"
              />
              <Button onClick={handleSend} disabled={isLoading} className="neon-glow">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Sidebar */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="w-80 space-y-4"
      >
        <Card className="glass-card border-border">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Suggested Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {suggestedPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => setInput(prompt.text)}
                className="w-full flex items-center gap-3 p-3 rounded-xl glass hover:neon-glow transition-all text-left group"
              >
                <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                  <prompt.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm text-foreground">{prompt.text}</span>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card border-border">
          <CardHeader>
            <CardTitle className="text-base text-foreground">AI Capabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {[
                "Cost analysis & forecasting",
                "Security risk assessment",
                "Resource optimization",
                "Multi-cloud queries",
                "Automated reports",
              ].map((capability, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="w-3 h-3 text-primary" />
                  {capability}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
