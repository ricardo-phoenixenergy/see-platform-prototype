'use client'
// components/admin/reconciliation-queue.tsx

import { useState, useTransition } from 'react'
import { reconcilePayment } from '@/server/actions/payments'
import { formatZAR } from '@/lib/payments/rail'
import { CheckCircle, ExternalLink, Loader2, AlertTriangle } from 'lucide-react'
import type { getPaymentsForReconciliation } from '@/server/queries/payments'

type PaymentRow = Awaited<ReturnType<typeof getPaymentsForReconciliation>>[number]

type Props = { payments: PaymentRow[] }

function paymentType(p: PaymentRow): 'escrow' | 'license' {
  return p.invoice.lineItems.some((li) => li.type === 'SERVICE_ESCROW') ? 'escrow' : 'license'
}

export function ReconciliationQueue({ payments }: Props) {
  const [reconciled, setReconciled] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [bankRefs, setBankRefs] = useState<Record<string, string>>({})

  function handleReconcile(id: string) {
    startTransition(async () => {
      await reconcilePayment(id, bankRefs[id] || undefined)
      setReconciled((prev) => new Set([...prev, id]))
    })
  }

  return (
    <div className="space-y-3">
      {payments.map((p) => {
        const done = reconciled.has(p.id)
        const type = paymentType(p)
        const description = p.invoice.lineItems[0]?.description ?? 'Payment'
        const missingPop = !p.proofOfPaymentUrl

        return (
          <div
            key={p.id}
            className={`rounded-lg border bg-white overflow-hidden transition-opacity ${done ? 'border-success-500/20 opacity-60' : 'border-ink-200'}`}
          >
            {/* Header */}
            <div className="px-4 py-3 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm ${
                    type === 'escrow'
                      ? 'bg-accent-500/10 text-accent-600'
                      : 'bg-ink-100 text-ink-600'
                  }`}>
                    {type === 'escrow' ? 'Service Escrow' : 'O&M License'}
                  </span>
                </div>
                <p className="text-sm font-medium text-ink-900">{description}</p>
                <p className="text-xs text-ink-500">
                  {p.invoice.recipientCompany.name} · {p.invoice.invoiceNumber}
                </p>
                {p.reference && (
                  <p className="text-xs text-ink-400 font-mono">{p.reference}</p>
                )}
              </div>
              <div className="flex-shrink-0 text-right space-y-0.5">
                <p className="text-sm font-semibold text-ink-900">{formatZAR(p.amountCents)}</p>
                <p className="text-xs text-ink-400">{new Date(p.updatedAt).toLocaleDateString('en-ZA')}</p>
              </div>
            </div>

            {/* POP link or warning */}
            {p.proofOfPaymentUrl ? (
              <div className="px-4 py-2 border-t border-ink-50 bg-ink-25">
                <a
                  href={p.proofOfPaymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-accent-600 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
                  View proof of payment
                </a>
              </div>
            ) : (
              <div className="px-4 py-2 border-t border-ink-50 bg-warning-50/30 flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3 text-warning-500 flex-shrink-0" strokeWidth={1.5} />
                <p className="text-xs text-warning-700">No proof of payment uploaded yet</p>
              </div>
            )}

            {/* Reconcile action */}
            {!done && (
              <div className="px-4 py-3 border-t border-ink-100 space-y-2">
                {missingPop && (
                  <p className="text-[10px] text-ink-400">
                    You can reconcile without a POP if payment was confirmed via other means.
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Bank statement reference (optional)"
                    value={bankRefs[p.id] ?? ''}
                    onChange={(e) => setBankRefs((prev) => ({ ...prev, [p.id]: e.target.value }))}
                    className="flex-1 h-8 rounded-md border border-ink-200 px-3 text-xs placeholder:text-ink-400 focus:outline-none focus:ring-1 focus:ring-accent-500/30"
                  />
                  <button
                    onClick={() => handleReconcile(p.id)}
                    disabled={isPending}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors disabled:opacity-50"
                  >
                    {isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
                    )}
                    Confirm &amp; activate
                  </button>
                </div>
              </div>
            )}

            {/* Done state */}
            {done && (
              <div className="px-4 py-2 border-t border-success-500/10 bg-success-50/20 flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-success-500" strokeWidth={1.5} />
                <p className="text-xs text-success-600 font-medium">
                  {type === 'escrow' ? 'Confirmed — job card activated, SP notified' : 'Reconciled — license activated'}
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
