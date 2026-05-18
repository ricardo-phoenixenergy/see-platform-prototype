'use client'
// components/admin/template-form.tsx
// Basic list-and-form template builder (spec: drag-drop is stretch goal).

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { createTemplate } from '@/server/actions/admin'

const TECHNOLOGIES = ['SOLAR_PV', 'WIND', 'BATTERY_STORAGE', 'HYBRID', 'BIOGAS', 'OTHER']
const PHASES = ['PLANNING', 'DESIGN', 'PROCUREMENT', 'CONSTRUCTION', 'COMMISSIONING', 'OPERATIONAL', 'DECOMMISSIONED']

type Item = {
  order: number
  name: string
  description: string
  phase: string
  isHardGate: boolean
  estimatedDays: string
}

const emptyItem = (order: number): Item => ({
  order,
  name: '',
  description: '',
  phase: 'PLANNING',
  isHardGate: true,
  estimatedDays: '',
})

type Props = {
  defaultValues?: {
    name: string
    technology: string
    minSizeKw: string
    maxSizeKw: string
    items: Item[]
  }
}

export function TemplateForm({ defaultValues }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(defaultValues?.name ?? '')
  const [technology, setTechnology] = useState(defaultValues?.technology ?? 'SOLAR_PV')
  const [minSizeKw, setMinSizeKw] = useState(defaultValues?.minSizeKw ?? '')
  const [maxSizeKw, setMaxSizeKw] = useState(defaultValues?.maxSizeKw ?? '')
  const [items, setItems] = useState<Item[]>(defaultValues?.items ?? [emptyItem(1)])
  const [error, setError] = useState<string | null>(null)

  function addItem() {
    setItems((prev) => [...prev, emptyItem(prev.length + 1)])
  }

  function removeItem(i: number) {
    setItems((prev) =>
      prev.filter((_, idx) => idx !== i).map((item, idx) => ({ ...item, order: idx + 1 }))
    )
  }

  function updateItem(i: number, field: keyof Item, value: string | boolean) {
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)))
  }

  function handleSubmit() {
    setError(null)
    if (!name.trim()) { setError('Template name is required.'); return }
    if (items.some((it) => !it.name.trim())) { setError('All milestone items must have a name.'); return }

    startTransition(async () => {
      try {
        await createTemplate({
          name,
          technology,
          minSizeKw: minSizeKw ? Number(minSizeKw) : undefined,
          maxSizeKw: maxSizeKw ? Number(maxSizeKw) : undefined,
          items: items.map((it) => ({
            order: it.order,
            name: it.name,
            description: it.description,
            phase: it.phase,
            isHardGate: it.isHardGate,
            estimatedDays: it.estimatedDays ? Number(it.estimatedDays) : undefined,
          })),
        })
        router.push('/admin/templates')
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save template.')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1">
          <label className="text-xs font-medium text-ink-700">Template name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Solar C&I < 1MW Outright"
            className="w-full h-9 rounded-md border border-ink-200 px-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-700">Technology</label>
          <select
            value={technology}
            onChange={(e) => setTechnology(e.target.value)}
            className="w-full h-9 rounded-md border border-ink-200 px-3 text-sm text-ink-900 bg-white focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          >
            {TECHNOLOGIES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-ink-700">Min size (kW)</label>
            <input
              type="number"
              value={minSizeKw}
              onChange={(e) => setMinSizeKw(e.target.value)}
              placeholder="0"
              className="w-full h-9 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-ink-700">Max size (kW)</label>
            <input
              type="number"
              value={maxSizeKw}
              onChange={(e) => setMaxSizeKw(e.target.value)}
              placeholder="1000"
              className="w-full h-9 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
            />
          </div>
        </div>
      </div>

      {/* Milestone items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Milestone items</p>
          <button
            onClick={addItem}
            className="flex items-center gap-1.5 text-xs text-accent-600 hover:underline font-medium"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            Add item
          </button>
        </div>

        {items.map((item, i) => (
          <div key={i} className="rounded-md border border-ink-200 bg-ink-25 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-500">#{item.order}</span>
              <button onClick={() => removeItem(i)} className="text-ink-300 hover:text-danger-500 transition-colors">
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-medium text-ink-700">Name</label>
                <input
                  value={item.name}
                  onChange={(e) => updateItem(i, 'name', e.target.value)}
                  placeholder="e.g., Environmental Impact Assessment"
                  className="w-full h-8 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-medium text-ink-700">Description</label>
                <input
                  value={item.description}
                  onChange={(e) => updateItem(i, 'description', e.target.value)}
                  placeholder="What the contractor must submit"
                  className="w-full h-8 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-700">Phase</label>
                <select
                  value={item.phase}
                  onChange={(e) => updateItem(i, 'phase', e.target.value)}
                  className="w-full h-8 rounded-md border border-ink-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent-500/20"
                >
                  {PHASES.map((p) => <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-700">Est. days</label>
                <input
                  type="number"
                  value={item.estimatedDays}
                  onChange={(e) => updateItem(i, 'estimatedDays', e.target.value)}
                  placeholder="14"
                  className="w-full h-8 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
                />
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <input
                  type="checkbox"
                  id={`hard-gate-${i}`}
                  checked={item.isHardGate}
                  onChange={(e) => updateItem(i, 'isHardGate', e.target.checked)}
                  className="h-4 w-4 rounded border-ink-300"
                />
                <label htmlFor={`hard-gate-${i}`} className="text-xs text-ink-700">
                  Hard gate (blocks project stage progression)
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-danger-600">{error}</p>}

      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="flex items-center justify-center gap-1.5 h-9 px-4 rounded-md bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 transition-colors disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save template
        </button>
        <button
          onClick={() => router.back()}
          className="h-9 px-4 rounded-md border border-ink-200 text-ink-600 text-sm hover:bg-ink-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
