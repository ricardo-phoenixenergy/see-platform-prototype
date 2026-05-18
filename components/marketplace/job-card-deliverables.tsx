'use client'
// components/marketplace/job-card-deliverables.tsx

import { useState, useTransition } from 'react'
import { addDeliverable } from '@/server/actions/marketplace'
import { ExternalLink, Upload, Loader2 } from 'lucide-react'

type Deliverable = { id: string; name: string; url: string; version: number; createdAt: string }
type Props = { jobCardId: string; deliverables: Deliverable[]; canUpload: boolean }

export function JobCardDeliverables({ jobCardId, deliverables, canUpload }: Props) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [localDeliverables, setLocalDeliverables] = useState(deliverables)

  function handleUpload() {
    setError(null)
    if (!name.trim() || !url.trim()) { setError('Name and URL are required.'); return }
    startTransition(async () => {
      try {
        await addDeliverable({ jobCardId, name, url })
        setLocalDeliverables((prev) => [
          ...prev,
          { id: Date.now().toString(), name, url, version: prev.length + 1, createdAt: new Date().toISOString() },
        ])
        setName('')
        setUrl('')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Upload failed.')
      }
    })
  }

  return (
    <div className="space-y-3">
      {localDeliverables.map((d) => (
        <a
          key={d.id}
          href={d.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-accent-600 hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
          {d.name} <span className="text-xs text-ink-400">v{d.version}</span>
        </a>
      ))}
      {localDeliverables.length === 0 && (
        <p className="text-xs text-ink-400">No deliverables uploaded yet.</p>
      )}

      {canUpload && (
        <div className="space-y-2 pt-2 border-t border-ink-100">
          <p className="text-xs font-medium text-ink-700">Add deliverable</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Document name"
            className="w-full h-8 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="File URL"
            className="w-full h-8 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          />
          {error && <p className="text-xs text-danger-600">{error}</p>}
          <button
            onClick={handleUpload}
            disabled={isPending}
            className="flex items-center gap-1.5 h-7 px-3 rounded-md border border-ink-200 text-ink-600 text-xs hover:bg-ink-50 transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" strokeWidth={1.5} />}
            Add file
          </button>
        </div>
      )}
    </div>
  )
}
