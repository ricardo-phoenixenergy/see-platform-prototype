'use client'

import { useState, useRef } from 'react'
import { AlertCircle, Copy, Check, Upload, Loader2 } from 'lucide-react'

type BankAccount = {
  accountName: string
  bankName: string
  accountNumber?: string | null
  branchCode?: string | null
}

type Props = {
  jobCardId: string
  amountCents: number
  reference: string
  bankAccount: BankAccount
  proofUrl: string | null
  paymentStatus: string
  uploadAction: (formData: FormData) => Promise<void>
}

function fmt(cents: number) {
  return `R ${(cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
}

export function EscrowPaymentBanner({
  jobCardId, amountCents, reference, bankAccount,
  proofUrl, paymentStatus, uploadAction,
}: Props) {
  const [copied, setCopied] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(!!proofUrl)
  const inputRef = useRef<HTMLInputElement>(null)

  const isAwaitingProof = paymentStatus === 'AWAITING_PROOF'
  const isAwaitingRecon = paymentStatus === 'AWAITING_RECONCILIATION' || paymentStatus === 'PROOF_UPLOADED'

  function copy(text: string, key: string) {
    void navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1800)
  }

  async function handleFileUpload(file: File) {
    setUploading(true)
    try {
      const signRes = await fetch('/api/upload/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, size: file.size, mimeType: file.type, purpose: 'proof_of_payment' }),
      })
      if (!signRes.ok) throw new Error('Failed to sign upload')
      const { uploadUrl } = await signRes.json() as { uploadUrl: string }
      await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file })

      const fd = new FormData()
      fd.append('jobCardId', jobCardId)
      fd.append('proofUrl', uploadUrl)
      await uploadAction(fd)
      setUploaded(true)
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  function Row({ label, value, copyKey }: { label: string; value: string; copyKey: string }) {
    return (
      <div className="flex items-center justify-between py-1.5 border-b border-ink-100 last:border-0">
        <span className="text-xs text-ink-500 w-32 flex-shrink-0">{label}</span>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-ink-900 truncate font-mono">{value}</span>
          <button
            type="button"
            onClick={() => copy(value, copyKey)}
            className="text-ink-400 hover:text-ink-700 flex-shrink-0"
            aria-label={`Copy ${label}`}
          >
            {copied === copyKey
              ? <Check className="h-3 w-3 text-success-500" strokeWidth={2} />
              : <Copy className="h-3 w-3" strokeWidth={1.5} />
            }
          </button>
        </div>
      </div>
    )
  }

  if (isAwaitingRecon || uploaded) {
    return (
      <div className="rounded-md border border-ink-200 bg-ink-25 px-4 py-3 flex items-center gap-3">
        <Loader2 className="h-4 w-4 text-ink-400 animate-spin flex-shrink-0" strokeWidth={1.5} />
        <div>
          <p className="text-sm font-medium text-ink-900">Proof of payment received — awaiting confirmation</p>
          <p className="text-xs text-ink-500 mt-0.5">
            Our team will confirm receipt of {fmt(amountCents)} and activate the job within 1 business day.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-warning-200 bg-warning-50/40 p-4 space-y-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-warning-600 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
        <div>
          <p className="text-sm font-semibold text-ink-900">Escrow payment required to activate this job</p>
          <p className="text-xs text-ink-500 mt-0.5">
            Transfer {fmt(amountCents)} (incl. VAT) to the account below using the reference provided.
            Funds will be held in escrow until you approve the deliverables.
          </p>
        </div>
      </div>

      {/* Banking details */}
      <div className="rounded-md bg-white border border-ink-200 px-4 py-2">
        <Row label="Bank" value={bankAccount.bankName} copyKey="bank" />
        <Row label="Account name" value={bankAccount.accountName} copyKey="name" />
        {bankAccount.accountNumber && (
          <Row label="Account number" value={bankAccount.accountNumber} copyKey="acc" />
        )}
        {bankAccount.branchCode && (
          <Row label="Branch code" value={bankAccount.branchCode} copyKey="branch" />
        )}
        <Row label="Amount" value={fmt(amountCents)} copyKey="amount" />
        <Row label="Reference" value={reference} copyKey="ref" />
      </div>

      {/* POP upload */}
      {isAwaitingProof && (
        <div>
          <p className="text-xs font-medium text-ink-700 mb-2">Upload proof of payment</p>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            className="sr-only"
            onChange={(e) => { if (e.target.files?.[0]) void handleFileUpload(e.target.files[0]) }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 h-8 px-4 rounded-md border border-ink-200 bg-white text-xs font-medium text-ink-700 hover:bg-ink-50 transition-colors disabled:opacity-50"
          >
            {uploading
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Uploading…</>
              : <><Upload className="h-3.5 w-3.5" strokeWidth={1.5} />Upload POP (PDF or image)</>
            }
          </button>
        </div>
      )}
    </div>
  )
}
