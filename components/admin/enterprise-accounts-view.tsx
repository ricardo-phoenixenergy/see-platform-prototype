'use client'
// components/admin/enterprise-accounts-view.tsx

import { useState, useTransition } from 'react'
import { addProjectToEnterpriseScope } from '@/server/actions/payments'
import { Plus, CheckCircle, Loader2 } from 'lucide-react'

type Project = { id: string; name: string; stage: string }

type Props = { licenseId: string; eligibleProjects: Project[] }

export function EnterpriseAccountsView({ licenseId, eligibleProjects }: Props) {
  const [selectedId, setSelectedId] = useState(eligibleProjects[0]?.id ?? '')
  const [isPending, startTransition] = useTransition()
  const [added, setAdded] = useState<string | null>(null)

  function handleAdd() {
    if (!selectedId) return
    startTransition(async () => {
      await addProjectToEnterpriseScope(licenseId, selectedId)
      const project = eligibleProjects.find((p) => p.id === selectedId)
      setAdded(project?.name ?? selectedId)
    })
  }

  if (added) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-success-500/20 bg-success-50/30 px-3 py-2">
        <CheckCircle className="h-4 w-4 text-success-500 flex-shrink-0" strokeWidth={1.5} />
        <p className="text-xs font-medium text-success-700">{added} added to Enterprise scope</p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 pt-2 border-t border-ink-100">
      <p className="text-xs text-ink-500 flex-shrink-0">Add project to scope:</p>
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="flex-1 h-8 rounded-md border border-ink-200 px-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-accent-500/30"
      >
        {eligibleProjects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.stage.toLowerCase()})
          </option>
        ))}
      </select>
      <button
        onClick={handleAdd}
        disabled={isPending || !selectedId}
        className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors disabled:opacity-50 flex-shrink-0"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
        )}
        Add to scope
      </button>
    </div>
  )
}
