'use client'
// components/payments/license-activation-animation.tsx

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Unlock, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OmLicenseTier } from '@/lib/generated/prisma/client'

type Props = {
  tier: OmLicenseTier
  projectName: string
  onComplete: () => void
}

export function LicenseActivationAnimation({ tier, projectName, onComplete }: Props) {
  const [phase, setPhase] = useState<'unlock' | 'toast' | 'done'>('unlock')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('toast'), 800)
    const t2 = setTimeout(() => { setPhase('done'); onComplete() }, 3200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onComplete])

  const monthlyDisplay = tier === 'AI' ? '1,200' : tier === 'PREMIUM' ? '850' : '450'

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md"
        >
          <div className="flex flex-col items-center gap-6 text-center">
            <motion.div
              initial={{ scale: 1 }}
              animate={phase === 'toast' ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] } : {}}
              transition={{ duration: 0.5 }}
              className="h-20 w-20 rounded-full bg-success-500/10 flex items-center justify-center"
            >
              {phase === 'unlock' ? (
                <Unlock className="h-9 w-9 text-success-600" strokeWidth={1.5} />
              ) : (
                <CheckCircle className="h-9 w-9 text-success-500" strokeWidth={1.5} />
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-1"
            >
              <p className="text-base font-semibold text-ink-900">
                {phase === 'unlock' ? 'Activating license...' : `${tier} License activated`}
              </p>
              <p className="text-sm text-ink-500">
                {phase === 'unlock'
                  ? `${projectName} — setting up your dashboard`
                  : 'Your plant monitoring dashboard is now live.'}
              </p>
            </motion.div>

            {phase === 'toast' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'rounded-lg border px-4 py-2.5 text-xs font-medium',
                  'border-success-500/20 bg-success-50/40 text-success-700'
                )}
              >
                Monthly fee R {monthlyDisplay} · Next billing in 30 days
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
