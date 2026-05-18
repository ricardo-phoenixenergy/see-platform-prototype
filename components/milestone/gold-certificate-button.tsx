'use client'
// components/milestone/gold-certificate-button.tsx
// Mocked PDF download — animated button, no real file generated.

import { useState } from 'react'
import { Award, Loader2, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type Props = { projectName: string }

export function GoldCertificateButton({ projectName }: Props) {
  const [state, setState] = useState<'idle' | 'generating' | 'done'>('idle')

  function handleClick() {
    setState('generating')
    setTimeout(() => setState('done'), 2200)
    setTimeout(() => setState('idle'), 5000)
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={state !== 'idle'}
        className="flex items-center gap-2 h-9 px-4 rounded-md bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 transition-colors disabled:opacity-60"
      >
        {state === 'generating' ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
        ) : state === 'done' ? (
          <CheckCircle className="h-4 w-4 text-success-400" strokeWidth={1.5} />
        ) : (
          <Award className="h-4 w-4" strokeWidth={1.5} />
        )}
        {state === 'generating'
          ? 'Generating certificate…'
          : state === 'done'
          ? 'Certificate ready'
          : 'Download Gold Standard Certificate'}
      </button>

      <AnimatePresence>
        {state === 'done' && (
          <motion.p
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-ink-400"
          >
            {projectName} — Gold Standard.pdf
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
