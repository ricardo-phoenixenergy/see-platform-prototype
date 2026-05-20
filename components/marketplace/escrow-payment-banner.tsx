'use client'

import { useState, useRef } from 'react'
import { AlertCircle, Copy, Check, Upload, Loader2, FileText, X } from 'lucide-react'
import { uploadFile } from '@/lib/upload-file'

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(!!proofUrl)
  const [uploadError, setUploadError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const isAwaitingRecon = paymentStatus === 'AWAITING_RECONCILIATION' || paymentStatus === 'PROOF_UPLOADED'

  function copy(text: string, key: string) {
    void navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1800)
  }

  async function handleSubmit() {
    if (!selectedFile) return
    setUploading(true)
    setUploadError('')

    try {
      const url = await uploadFile(selectedFile, 'proof_of_payment')

      const fd = new FormData()
      fd.append('jobCardId', jobCardId)
      fd.append('proofUrl', url)
      await uploadAction(fd)

      setUploaded(true)
      setSelectedFile(null)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  function Row({ label, value, copyKey }: { label: string; value: string; copyKey: string }) {
    return (
      <div className="flex items-center justify-between py-1.5 border-b border-ink-100 last:border-0">
        <span className="text-xs text-ink-500 w-36 flex-shrink-0">{label}</span>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-xs font-medium text-ink-900 truncate font-mono">{value}</span>
          <button
            type="button"
            onClick={() => copy(value, copyKey)}
            className="text-ink-300 hover:text-ink-700 flex-shrink-0 ml-auto"
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

  // ── Already submitted / awaiting confirmation ──
  if (isAwaitingRecon || uploaded) {
    return (
      <div className="rounded-md border border-ink-200 bg-ink-25 px-4 py-3 flex items-center gap-3">
        <Loader2 className="h-4 w-4 text-ink-400 animate-spin flex-shrink-0" strokeWidth={1.5} />
        <div>
          <p className="text-sm font-medium text-ink-900">Proof of payment submitted — awaiting confirmation</p>
          <p className="text-xs text-ink-500 mt-0.5">
            Our team will verify receipt and activate the job within 1 business day.
          </p>
        </div>
      </div>
    )
  }

  // ── Awaiting proof ──
  return (
    <div className="rounded-md border border-warning-200 bg-warning-50/40 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-warning-600 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
        <div>
          <p className="text-sm font-semibold text-ink-900">Escrow payment required to activate this job</p>
          <p className="text-xs text-ink-500 mt-0.5">
            Transfer <span className="font-medium text-ink-700">{fmt(amountCents)}</span> excl. VAT to the
            account below using the exact reference. Upload proof of payment once sent.
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
        <Row label="Amount" value={`${fmt(amountCents)} excl. VAT`} copyKey="amount" />
        <div className="flex items-center justify-between py-1.5">
          <span className="text-xs text-ink-500 w-36 flex-shrink-0">Reference</span>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xs font-bold text-ink-900 font-mono tracking-wide">{reference}</span>
            <button
              type="button"
              onClick={() => copy(reference, 'ref')}
              className="text-ink-300 hover:text-ink-700 flex-shrink-0 ml-auto"
              aria-label="Copy reference"
            >
              {copied === 'ref'
                ? <Check className="h-3 w-3 text-success-500" strokeWidth={2} />
                : <Copy className="h-3 w-3" strokeWidth={1.5} />
              }
            </button>
          </div>
        </div>
      </div>

      {/* POP upload — two-step: select then submit */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-ink-700">Upload proof of payment</p>

        {!selectedFile ? (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) { setSelectedFile(f); setUploadError('') }
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-2 h-9 px-4 rounded-md border-2 border-dashed border-ink-300 bg-white text-xs font-medium text-ink-600 hover:border-ink-400 hover:bg-ink-50 transition-colors w-full justify-center"
            >
              <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
              Click to select PDF or image
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3 rounded-md border border-ink-200 bg-white px-3 py-2">
            <FileText className="h-4 w-4 text-ink-400 flex-shrink-0" strokeWidth={1.5} />
            <span className="text-xs text-ink-700 flex-1 truncate">{selectedFile.name}</span>
            <button
              type="button"
              onClick={() => { setSelectedFile(null); if (inputRef.current) inputRef.current.value = '' }}
              className="text-ink-400 hover:text-ink-700"
              aria-label="Remove file"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>
        )}

        {uploadError && (
          <p className="text-xs text-danger-600">{uploadError}</p>
        )}

        {selectedFile && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-md bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Submitting…</>
            ) : (
              'Submit proof of payment'
            )}
          </button>
        )}
      </div>
    </div>
  )
}
