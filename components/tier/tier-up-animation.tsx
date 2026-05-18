'use client'
// components/tier/tier-up-animation.tsx
// Framer Motion tier-up celebration. Triggered by ?tierUp=SILVER (etc.) in URL.

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

type Tier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'

const TIER_COLOURS: Record<Tier, string> = {
  BRONZE: '#CD7F32',
  SILVER: '#9EA3AD',
  GOLD: '#F59E0B',
  PLATINUM: '#7C3AED',
}

const TIER_LABELS: Record<Tier, string> = {
  BRONZE: 'Bronze',
  SILVER: 'Silver',
  GOLD: 'Gold',
  PLATINUM: 'Platinum',
}

export function TierUpAnimation() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const tierParam = searchParams.get('tierUp') as Tier | null
  const [visible, setVisible] = useState(!!tierParam && tierParam in TIER_COLOURS)

  useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => {
      setVisible(false)
      const params = new URLSearchParams(searchParams.toString())
      params.delete('tierUp')
      const qs = params.toString()
      router.replace(pathname + (qs ? `?${qs}` : ''))
    }, 4000)
    return () => clearTimeout(t)
  }, [visible, pathname, router, searchParams])

  if (!tierParam || !(tierParam in TIER_COLOURS)) return null

  const colour = TIER_COLOURS[tierParam]
  const label = TIER_LABELS[tierParam]

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
        >
          <motion.div
            className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 280 }}
            className="relative z-10 flex flex-col items-center gap-4 px-12 py-10 bg-white rounded-2xl shadow-2xl"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 15 }}
              className="h-16 w-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
              style={{ backgroundColor: colour }}
            >
              {label[0]}
            </motion.div>

            <div className="text-center">
              <p className="text-xs font-semibold tracking-widest text-ink-400 uppercase mb-1">Tier upgrade</p>
              <p className="text-2xl font-semibold text-ink-900">
                You&apos;re now{' '}
                <span style={{ color: colour }}>{label}</span>
              </p>
              <p className="text-sm text-ink-500 mt-1">New benefits and higher cashback rates are now active.</p>
            </div>

            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-2 w-2 rounded-full"
                style={{ backgroundColor: colour }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: Math.cos((i / 8) * Math.PI * 2) * 80,
                  y: Math.sin((i / 8) * Math.PI * 2) * 80,
                  opacity: 0,
                  scale: 0,
                }}
                transition={{ delay: 0.1, duration: 0.8, ease: 'easeOut' }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
