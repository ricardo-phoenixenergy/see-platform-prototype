'use client'
// components/payments/eft-instructions-modal.tsx

import { useState, useTransition } from 'react'
import { Copy, CheckCircle, Loader2, X } from 'lucide-react'
import { uploadProofOfPayment } from '@/server/actions/payments'
import { formatZAR } from '@/lib/payments/rail'
import { cn } from '@/lib/utils'

const BANK = {
  accountName: 'SEE Platform Operations (Pty) Ltd',
  bank: 'First National Bank',
  accountNumber: '62850012345',
  branchCode: '250655',
  accountType: 'Business Cheque',
}

type Props = {
  paymentId: string
  reference: string
  amountCents: number
  onClose: () => void
  onReconciled: () => void
}

export function EftInstructionsModal({ paymentId, reference, amountCents, onClose, onReconciled }: Props) {
  const [copied, setCopied] = useState<string | null>(null)
  const [proofUrl, setProofUrl] = useState('')
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)

  function copy(text: string, key: string) {
    void navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  function handleSubmitPop() {
    if (!proofUrl.trim()) return
    startTransition(async () => {
      await uploadProofOfPayment(paymentId, proofUrl.trim())
      setSubmitted(true)
      setTimeout(() => { onClose(); onReconciled() }, 2500)
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-xl border border-ink-200 shadow-2xl w-full max-w-[520px] p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ink-900">Pay via EFT</p>
            <p className="text-xs text-ink-500 mt-0.5">Transfer {formatZAR(amountCents)} using the details below</p>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 transition-colors">
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="rounded-lg border border-ink-200 bg-ink-25 divide-y divide-ink-100">
          {[
            { label: 'Account name', value: BANK.accountName },
            { label: 'Bank', value: BANK.bank },
            { label: 'Account number', value: BANK.accountNumber, copyKey: 'acc' },
            { label: 'Branch code', value: BANK.branchCode, copyKey: 'branch' },
            { label: 'Account type', value: BANK.accountType },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-ink-500">{row.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-ink-900 font-mono">{row.value}</span>
                {row.copyKey && (
                  <button onClick={() => copy(row.value, row.copyKey!)} className="text-ink-400 hover:text-ink-700">
                    {copied === row.copyKey
                      ? <CheckCircle className="h-3.5 w-3.5 text-success-500" />
                      : <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
                    }
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border-2 border-accent-400 bg-accent-500/5 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-accent-600">Payment reference</p>
              <p className="text-lg font-semibold text-ink-900 font-mono mt-0.5">{reference}</p>
            </div>
            <button
              onClick={() => copy(reference, 'ref')}
              className={cn(
                'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border transition-colors',
                copied === 'ref'
                  ? 'bg-success-500/10 text-success-600 border-success-500/20'
                  : 'bg-white text-ink-600 border-ink-200 hover:border-ink-400'
              )}
            >
              {copied === 'ref' ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />}
              {copied === 'ref' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-accent-600/70 mt-1.5">Use this reference exactly — it is how your payment gets matched.</p>
        </div>

        {!submitted ? (
          <div className="space-y-3">
            <p className="text-xs text-ink-700 font-medium">Once you have made the transfer, upload your proof of payment:</p>
            <input
              type="url"
              placeholder="Paste proof of payment URL (bank screenshot or PDF link)"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              className="w-full h-9 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
            />
            <button
              onClick={handleSubmitPop}
              disabled={isPending || !proofUrl.trim()}
              className="w-full flex items-center justify-center gap-1.5 h-9 rounded-md bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 transition-colors disabled:opacity-40"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Submit proof of payment
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-success-500/20 bg-success-50/30 px-4 py-3">
            <CheckCircle className="h-5 w-5 text-success-500 flex-shrink-0" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-ink-900">Proof of payment received</p>
              <p className="text-xs text-ink-500">Your payment is being processed. We will notify you once reconciled.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
