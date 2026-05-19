'use client'
// components/client/offer-accept-section.tsx

import { useState, useTransition } from 'react'
import { Zap, Loader2 } from 'lucide-react'
import { acceptLicenseOffer } from '@/server/actions/payments'
import { EftInstructionsModal } from '@/components/payments/eft-instructions-modal'
import { LicenseActivationAnimation } from '@/components/payments/license-activation-animation'
import { formatZAR } from '@/lib/payments/rail'
import type { OmLicenseTier } from '@/lib/generated/prisma/client'

type Props = {
  offerId: string
  tier: OmLicenseTier
  monthlyFeeCents: number
  epcName: string
  projectName: string
}

type EftState = { paymentId: string; reference: string; amountCents: number }

export function OfferAcceptSection({ offerId, tier, monthlyFeeCents, epcName, projectName }: Props) {
  const [isPending, startTransition] = useTransition()
  const [eftState, setEftState] = useState<EftState | null>(null)
  const [showAnimation, setShowAnimation] = useState(false)

  function handleAccept() {
    startTransition(async () => {
      const result = await acceptLicenseOffer(offerId)
      setEftState(result)
    })
  }

  if (showAnimation) {
    return (
      <LicenseActivationAnimation
        tier={tier}
        projectName={projectName}
        onComplete={() => { window.location.reload() }}
      />
    )
  }

  const tierFeatures: Record<OmLicenseTier, [string, string, string]> = {
    BASIC: ['Live production data', 'Battery SoC tracking', 'Monthly performance report'],
    PREMIUM: ['Everything in Basic', '12-month analytics', 'Maintenance scheduling'],
    AI: ['Everything in Premium', 'Prescriptive maintenance alerts', 'Fault prediction'],
  }

  return (
    <>
      <div className="rounded-xl border border-accent-300 bg-accent-500/5 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-accent-500/10 flex items-center justify-center flex-shrink-0">
            <Zap className="h-5 w-5 text-accent-600" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-900">
              {epcName} has proposed an O&amp;M license for this site
            </p>
            <p className="text-xs text-ink-500 mt-0.5">
              {tier} tier · {formatZAR(monthlyFeeCents)}/month · Activate to unlock plant monitoring
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {tierFeatures[tier].map((f) => (
            <div key={f} className="flex items-center gap-1.5 text-xs text-ink-600">
              <span className="text-accent-500 font-bold">✓</span> {f}
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={handleAccept}
            disabled={isPending}
            className="flex items-center gap-1.5 h-9 px-4 rounded-md bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 transition-colors disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <Zap className="h-4 w-4" strokeWidth={1.5} />
            Accept &amp; pay {formatZAR(Math.round(monthlyFeeCents * 1.15))} via EFT
          </button>
          <button className="h-9 px-3 rounded-md border border-ink-200 text-ink-600 text-sm hover:bg-ink-50 transition-colors">
            View full proposal
          </button>
        </div>
      </div>

      {eftState && (
        <EftInstructionsModal
          paymentId={eftState.paymentId}
          reference={eftState.reference}
          amountCents={eftState.amountCents}
          onClose={() => setEftState(null)}
          onReconciled={() => { setEftState(null); setShowAnimation(true) }}
        />
      )}
    </>
  )
}
