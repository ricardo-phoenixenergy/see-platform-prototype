'use client'
// components/marketplace/job-card-kanban.tsx

import Link from 'next/link'
import { cn } from '@/lib/utils'

type JobCardItem = {
  id: string
  title: string
  project: string
  amountCents: number
  status: 'ACTIVE' | 'PENDING_REVIEW' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED'
}

type Props = { jobCards: JobCardItem[] }

const COLUMNS: { status: JobCardItem['status']; label: string }[] = [
  { status: 'ACTIVE', label: 'Active' },
  { status: 'PENDING_REVIEW', label: 'Pending Review' },
  { status: 'COMPLETED', label: 'Completed' },
]

const COLUMN_BORDER: Record<string, string> = {
  ACTIVE: 'border-accent-200',
  PENDING_REVIEW: 'border-warning-200',
  COMPLETED: 'border-success-500/30',
}

const CARD_CLASS: Record<string, string> = {
  ACTIVE: 'border-accent-200 bg-accent-500/5',
  PENDING_REVIEW: 'border-warning-200 bg-warning-50/30',
  COMPLETED: 'border-success-500/20 bg-success-50/20',
}

export function JobCardKanban({ jobCards }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {COLUMNS.map((col) => {
        const cards = jobCards.filter((jc) => jc.status === col.status)
        return (
          <div key={col.status} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-500">{col.label}</p>
              <span className="text-xs text-ink-400 tabular-nums">{cards.length}</span>
            </div>
            {cards.length === 0 && (
              <div className={cn('rounded-lg border-2 border-dashed p-6 text-center', COLUMN_BORDER[col.status] ?? 'border-ink-200')}>
                <p className="text-xs text-ink-400">No {col.label.toLowerCase()} jobs</p>
              </div>
            )}
            {cards.map((card) => (
              <Link
                key={card.id}
                href={`/service-provider/job-cards/${card.id}`}
                className={cn(
                  'block rounded-lg border p-4 space-y-2 hover:shadow-sm transition-shadow',
                  CARD_CLASS[card.status] ?? 'border-ink-200 bg-white'
                )}
              >
                <p className="text-sm font-semibold text-ink-900 leading-tight">{card.title}</p>
                <p className="text-xs text-ink-500">{card.project}</p>
                <p className="text-sm font-semibold text-ink-900">
                  R {(card.amountCents / 100).toLocaleString('en-ZA')}
                </p>
              </Link>
            ))}
          </div>
        )
      })}
    </div>
  )
}
