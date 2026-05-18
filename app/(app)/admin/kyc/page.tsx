'use client'

import { useState, useEffect } from 'react'
import { KycReviewPanel } from '@/components/admin/kyc-review-panel'
import { cn } from '@/lib/utils'

type KycItem = {
  id: string
  status: string
  createdAt: string
  rejectionReason: string | null
  cipcDocUrl: string | null
  vatDocUrl: string | null
  directorIdUrl: string | null
  company: { name: string; type: string; registrationNo: string | null; vatNo: string | null }
}

export default function KycQueuePage() {
  const [items, setItems] = useState<KycItem[]>([])
  const [selected, setSelected] = useState<KycItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  async function load() {
    const res = await fetch('/api/admin/kyc')
    if (res.ok) {
      const data = await res.json() as { submissions: KycItem[] }
      setItems(data.submissions)
    }
    setIsLoading(false)
  }

  useEffect(() => { void load() }, [])

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink-900">KYC Queue</h2>
        <p className="text-sm text-ink-500">Review company KYC submissions — approve, reject, or request additional information.</p>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-md bg-ink-50 animate-pulse" />)}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-sm font-medium text-ink-900">No pending KYC submissions</p>
          <p className="text-xs text-ink-500 mt-1">All submissions have been reviewed.</p>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="rounded-lg border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink-25 border-b border-ink-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Company</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Submitted</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-ink-25 transition-colors">
                  <td className="px-4 py-3 font-medium text-ink-900">{item.company.name}</td>
                  <td className="px-4 py-3 text-ink-500">{item.company.type}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-[10px] font-semibold px-1.5 py-0.5 rounded-sm',
                      item.status === 'PENDING' ? 'bg-ink-100 text-ink-600' : 'bg-warning-50 text-warning-700'
                    )}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-500 text-xs">
                    {new Date(item.createdAt).toLocaleDateString('en-ZA')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelected(item)}
                      className="text-xs text-accent-600 hover:underline font-medium"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <KycReviewPanel
          submission={{ ...selected, createdAt: new Date(selected.createdAt) }}
          onClose={() => setSelected(null)}
          onDecision={() => { void load() }}
        />
      )}
    </div>
  )
}
