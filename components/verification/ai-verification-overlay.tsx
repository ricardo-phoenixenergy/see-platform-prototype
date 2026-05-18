'use client'
// components/verification/ai-verification-overlay.tsx
// Full-screen animated overlay: log lines appear one by one during AI analysis.

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AI_VERIFICATION_LOG_LINES } from '@/lib/ai/verification-stubs'

type Props = {
  milestoneName: string
  onComplete: () => void
}

export function AiVerificationOverlay({ milestoneName, onComplete }: Props) {
  const [visibleLines, setVisibleLines] = useState<string[]>([])

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      const line = AI_VERIFICATION_LOG_LINES[i]
      if (line) setVisibleLines((prev) => [...prev, line])
      i++
      if (i >= AI_VERIFICATION_LOG_LINES.length) {
        clearInterval(interval)
      }
    }, 900)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink-950/90 backdrop-blur-sm"
    >
      <div className="w-full max-w-md px-6">
        <p className="text-[11px] font-semibold tracking-widest text-ink-400 uppercase mb-6 text-center">
          SEE.AI Verification Agent
        </p>
        <p className="text-lg font-semibold text-white mb-8 text-center">{milestoneName}</p>

        <div className="h-0.5 bg-ink-800 rounded-full mb-8 overflow-hidden">
          <motion.div
            className="h-full bg-accent-500"
            initial={{ width: '0%' }}
            animate={{ width: `${(visibleLines.length / AI_VERIFICATION_LOG_LINES.length) * 100}%` }}
            transition={{ ease: 'linear' }}
          />
        </div>

        <div className="space-y-2 min-h-[160px]">
          <AnimatePresence>
            {visibleLines.map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm text-ink-300 font-mono"
              >
                <span className="text-accent-500 mr-2">›</span>
                {line}
              </motion.p>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
