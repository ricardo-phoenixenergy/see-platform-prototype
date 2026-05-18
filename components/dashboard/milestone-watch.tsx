import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { EmptyState } from '@/components/ui/empty-state'
import { CheckSquare } from 'lucide-react'

type Milestone = {
  id: string
  name: string
  status: string
  dueDate: Date | null
  project: { name: string }
}

type Props = { milestones: Milestone[] }

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  AVAILABLE: { label: 'Ready', className: 'bg-ink-100 text-ink-600' },
  IN_PROGRESS: { label: 'In progress', className: 'bg-accent-50 text-accent-700' },
  SUBMITTED: { label: 'Submitted', className: 'bg-ink-100 text-ink-600' },
  UNDER_REVIEW: { label: 'Under review', className: 'bg-amber-50 text-amber-700' },
  ACTION_REQUIRED: { label: 'Action required', className: 'bg-red-50 text-red-700' },
}

export function MilestoneWatch({ milestones }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Milestone watch</CardTitle>
      </CardHeader>
      <CardContent>
        {milestones.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="All clear"
            description="No milestones require attention right now."
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {milestones.map(ms => {
              const style = STATUS_STYLES[ms.status] ?? { label: ms.status, className: 'bg-ink-100 text-ink-600' }
              return (
                <li key={ms.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{ms.name}</p>
                    <p className="text-xs text-ink-400 truncate">{ms.project.name}</p>
                    {ms.dueDate && (
                      <p className="text-xs text-ink-400 mt-0.5">Due {formatDate(ms.dueDate)}</p>
                    )}
                  </div>
                  <span className={`flex-shrink-0 rounded-sm px-2 py-0.5 text-[10px] font-medium ${style.className}`}>
                    {style.label}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
