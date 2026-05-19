'use client'
// components/client/om-event-form.tsx

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { createOmEvent } from '@/server/actions/client'

const EVENT_TYPES = [
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'CLEANING', label: 'Panel Cleaning' },
  { value: 'INSPECTION', label: 'Inspection' },
  { value: 'REPAIR', label: 'Repair' },
  { value: 'CLIENT_MEETING', label: 'Client Meeting' },
  { value: 'SITE_VISIT', label: 'Site Visit' },
]

type Props = { projectId: string; onClose: () => void; onCreated: () => void }

export function OmEventForm({ projectId, onClose, onCreated }: Props) {
  const [isPending, startTransition] = useTransition()
  const [type, setType] = useState('MAINTENANCE')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit() {
    setError(null)
    if (!title.trim() || !scheduledAt) { setError('Title and date are required.'); return }
    startTransition(async () => {
      try {
        await createOmEvent({
          projectId,
          type,
          title,
          description: description || undefined,
          scheduledAt: new Date(scheduledAt).toISOString(),
        })
        onCreated()
        onClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to create event.')
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-xl border border-ink-200 shadow-2xl w-[440px] p-6 space-y-4">
        <p className="text-sm font-semibold text-ink-900">Schedule maintenance event</p>

        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-700">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full h-9 rounded-md border border-ink-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          >
            {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-700">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Quarterly inverter service"
            className="w-full h-9 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-700">Date</label>
          <input
            type="date"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full h-9 rounded-md border border-ink-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-700">Notes (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Additional details…"
            className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20 resize-none"
          />
        </div>

        {error && <p className="text-sm text-danger-600">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Schedule
          </button>
          <button
            onClick={onClose}
            className="h-8 px-3 rounded-md border border-ink-200 text-ink-600 text-xs hover:bg-ink-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
