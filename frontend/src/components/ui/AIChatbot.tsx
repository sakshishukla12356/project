import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, X, Bot } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

export const AIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-80 md:w-96"
          >
            <GlassCard className="flex flex-col h-[500px] p-0 overflow-hidden border-primary/30" tilt={false}>
              {/* Header */}
              <div className="p-4 border-b border-glass-border flex items-center justify-between bg-primary/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center glow-green">
                    <Bot className="text-background w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">GUARD_AI</h3>
                    <p className="text-[10px] text-primary font-black uppercase">Online</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="hover:text-primary transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-glass-border flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-glass-border/50 rounded-2xl rounded-tl-none p-3 text-xs leading-relaxed">
                    Greetings, Commander. I am the Guard AI. How can I assist you with your cloud infrastructure optimization today?
                  </div>
                </div>
              </div>

              {/* Input */}
              <div className="p-4 border-t border-glass-border">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ask anything..."
                    className="w-full glass bg-glass/20 border-glass-border rounded-xl py-3 pl-4 pr-10 text-xs focus:border-primary/50 outline-none"
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:scale-110 transition-transform">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-primary text-background flex items-center justify-center glow-green hover:scale-110 transition-transform shadow-2xl"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>
    </div>
  );
};
