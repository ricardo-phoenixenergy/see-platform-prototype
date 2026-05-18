'use client'
// components/marketplace/rfq-form.tsx

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createRfq } from '@/server/actions/marketplace'

const CATEGORIES = [
  { value: 'STRUCTURAL_CIVILS', label: 'Structural & Civils' },
  { value: 'ENGINEERING', label: 'Engineering' },
  { value: 'LEGAL', label: 'Legal' },
  { value: 'LOGISTICS_PLANT_HIRE', label: 'Logistics & Plant Hire' },
  { value: 'FINANCE_INSURANCE', label: 'Finance & Insurance' },
]

type Props = {
  projectId: string
  milestoneId?: string
  milestoneName?: string
}

export function RfqForm({ projectId, milestoneId, milestoneName }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [category, setCategory] = useState('STRUCTURAL_CIVILS')
  const [title, setTitle] = useState(milestoneName ? `Service provider needed — ${milestoneName}` : '')
  const [description, setDescription] = useState('')
  const [scopeOfWork, setScopeOfWork] = useState('')
  const [budget, setBudget] = useState('')
  const [deadlineDays, setDeadlineDays] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit() {
    setError(null)
    if (!title.trim() || !description.trim() || !scopeOfWork.trim()) {
      setError('Title, description, and scope of work are required.')
      return
    }
    startTransition(async () => {
      try {
        const rfqId = await createRfq({
          projectId,
          milestoneId,
          category,
          title,
          description,
          scopeOfWork,
          budgetCentsMax: budget ? Number(budget) : undefined,
          deadlineDays: deadlineDays ? Number(deadlineDays) : undefined,
        })
        router.push(`/contractor/service-center/rfq/${rfqId}`)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to post RFQ.')
      }
    })
  }

  return (
    <div className="space-y-5">
      {milestoneName && (
        <div className="rounded-md bg-accent-500/5 border border-accent-200 px-3 py-2 text-xs text-accent-700">
          Linked to milestone: <span className="font-semibold">{milestoneName}</span>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-medium text-ink-700">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full h-9 rounded-md border border-ink-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent-500/20"
        >
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-ink-700">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Structural Engineering Report — 450kW Retail Solar"
          className="w-full h-9 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-ink-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Brief description of what you need…"
          className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20 resize-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-ink-700">Scope of work</label>
        <textarea
          value={scopeOfWork}
          onChange={(e) => setScopeOfWork(e.target.value)}
          rows={4}
          placeholder="Detailed scope: deliverables, standards, certifications required…"
          className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-700">Budget max (ZAR)</label>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="85000"
            className="w-full h-9 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-700">Deadline (days)</label>
          <input
            type="number"
            value={deadlineDays}
            onChange={(e) => setDeadlineDays(e.target.value)}
            placeholder="21"
            className="w-full h-9 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          />
        </div>
      </div>

      {error && <p className="text-sm text-danger-600">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="flex items-center justify-center gap-1.5 h-9 px-4 rounded-md bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 transition-colors disabled:opacity-50"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Post RFQ
      </button>
    </div>
  )
}
