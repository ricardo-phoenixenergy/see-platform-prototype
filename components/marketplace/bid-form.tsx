'use client'
// components/marketplace/bid-form.tsx

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { submitBid } from '@/server/actions/marketplace'

type Props = {
  rfqId: string
  companyId: string
  /** Called with the submitted amount in cents after a successful bid. */
  onSuccess: (amountCents: number) => void
}

export function BidForm({ rfqId, companyId, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition()
  const [amount, setAmount] = useState('')
  const [proposalText, setProposalText] = useState('')
  const [estimatedDays, setEstimatedDays] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit() {
    setError(null)
    if (!amount || !proposalText.trim() || !estimatedDays) {
      setError('All fields are required.')
      return
    }
    startTransition(async () => {
      try {
        // submitBid expects the amount in ZAR (it multiplies by 100 internally)
        const amountZar = Number(amount)
        await submitBid({
          rfqId,
          companyId,
          amountCents: amountZar,
          proposalText,
          estimatedDays: Number(estimatedDays),
        })
        onSuccess(Math.round(amountZar * 100))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to submit bid.')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-700">Bid amount (ZAR)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="72000"
            className="w-full h-9 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-700">Estimated days</label>
          <input
            type="number"
            value={estimatedDays}
            onChange={(e) => setEstimatedDays(e.target.value)}
            placeholder="18"
            className="w-full h-9 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-ink-700">Proposal</label>
        <textarea
          value={proposalText}
          onChange={(e) => setProposalText(e.target.value)}
          rows={4}
          placeholder="Describe your approach, relevant experience, and why you're the right fit…"
          className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20 resize-none"
        />
      </div>
      {error && <p className="text-sm text-danger-600">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="flex items-center justify-center gap-1.5 h-9 px-4 rounded-md bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 transition-colors disabled:opacity-50"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Submit bid
      </button>
    </div>
  )
}
