"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState } from "react"
import { Bot, Send, User, Sparkles, TrendingDown, Shield, Server } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const examplePrompts = [
  { icon: TrendingDown, text: "Why is my AWS bill high?" },
  { icon: Shield, text: "Check my security risks" },
  { icon: Server, text: "Stop idle EC2 instances" },
]

const demoConversation = [
  {
    role: "user",
    content: "Show my highest cloud expense this month",
  },
  {
    role: "assistant",
    content: `Based on your current cloud usage, here's the breakdown:

**Top 3 Expenses:**
1. **EC2 Instances** - $34,500 (38%)
   - 12 instances running 24/7
   - 4 instances appear idle

2. **RDS Databases** - $22,300 (25%)
   - 3 production databases
   - Dev database running during off-hours

3. **Data Transfer** - $15,200 (17%)
   - Cross-region transfers increased 40%

**💡 Recommendation:** You could save ~$8,500/month by:
- Stopping 4 idle EC2 instances
- Scheduling dev database shutdown
- Using VPC endpoints for S3 access`,
  },
]

export function ChatbotSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [inputValue, setInputValue] = useState("")

  return (
    <section className="relative py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-medium tracking-wider uppercase">AI Assistant</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-6 text-balance">
            Your Personal <span className="text-primary neon-text">Cloud AI Assistant</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Ask questions, get recommendations, and manage your cloud resources 
            with natural language commands powered by advanced AI.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Chat Interface */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-card rounded-2xl overflow-hidden"
          >
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">CloudGuard AI</h3>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              </div>
              <Sparkles className="ml-auto w-5 h-5 text-primary animate-pulse" />
            </div>

            {/* Chat Messages */}
            <div className="p-4 h-[400px] overflow-y-auto space-y-4">
              {demoConversation.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.2 }}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "glass rounded-bl-sm"
                    }`}
                  >
                    <p className={`text-sm whitespace-pre-line ${msg.role === "assistant" ? "text-foreground" : ""}`}>
                      {msg.content}
                    </p>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-secondary-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about your cloud resources..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="bg-muted/50 border-border"
                />
                <Button size="icon" className="neon-glow">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Example Prompts & Capabilities */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-6"
          >
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-semibold text-foreground mb-4">Try asking:</h3>
              <div className="space-y-3">
                {examplePrompts.map((prompt, index) => (
                  <motion.button
                    key={prompt.text}
                    initial={{ opacity: 0, x: 20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl glass hover:neon-glow transition-all text-left group"
                    onClick={() => setInputValue(prompt.text)}
                  >
                    <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                      <prompt.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm text-foreground">{prompt.text}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-semibold text-foreground mb-4">AI Capabilities</h3>
              <ul className="space-y-3">
                {[
                  "Natural language cost queries",
                  "Real-time security analysis",
                  "Automated resource recommendations",
                  "Multi-cloud management",
                  "Custom report generation",
                  "Anomaly detection alerts",
                ].map((capability, index) => (
                  <motion.li
                    key={capability}
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.3, delay: 0.8 + index * 0.05 }}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Sparkles className="w-3 h-3 text-primary" />
                    {capability}
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
