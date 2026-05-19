'use client'
// components/ai/chat-widget.tsx

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot } from 'lucide-react'
import { ChatPanel } from './chat-panel'

export function ChatWidget() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full bg-accent-500 text-white shadow-lg hover:bg-accent-600 transition-colors flex items-center justify-center"
        aria-label="Open SEE.AI"
      >
        <Bot className="h-5 w-5" strokeWidth={1.5} />
      </button>

      {/* Slide-up panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-40 w-[380px] h-[520px] rounded-2xl border border-ink-200 bg-white shadow-2xl flex flex-col overflow-hidden"
          >
            <ChatPanel onClose={() => setOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
