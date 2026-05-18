import { cn } from '@/lib/utils'
import { CheckCircle, Lock, Clock, AlertCircle, Star, ChevronRight } from 'lucide-react'
import Link from 'next/link'

type Status =
  | 'LOCKED'
  | 'AVAILABLE'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ACTION_REQUIRED'
  | 'APPROVED'
  | 'AUTO_GOLD'

type Props = {
  id: string
  projectId: string
  order: number
  name: string
  description: string
  status: Status
  isHardGate: boolean
  dueDate?: Date | null
  hasSubmission: boolean
}

type StatusConfig = {
  icon: React.ElementType
  iconClass: string
  label: string
  labelClass: string
  lineClass: string
}

const STATUS_CONFIG: Record<Status, StatusConfig> = {
  LOCKED: {
    icon: Lock,
    iconClass: 'text-ink-300',
    label: 'Locked',
    labelClass: 'text-ink-400',
    lineClass: 'bg-ink-100',
  },
  AVAILABLE: {
    icon: ChevronRight,
    iconClass: 'text-ink-500',
    label: 'Ready to submit',
    labelClass: 'text-ink-600',
    lineClass: 'bg-ink-200',
  },
  IN_PROGRESS: {
    icon: Clock,
    iconClass: 'text-accent-500',
    label: 'In progress',
    labelClass: 'text-accent-600',
    lineClass: 'bg-accent-200',
  },
  SUBMITTED: {
    icon: Clock,
    iconClass: 'text-ink-400',
    label: 'Submitted',
    labelClass: 'text-ink-500',
    lineClass: 'bg-ink-200',
  },
  UNDER_REVIEW: {
    icon: AlertCircle,
    iconClass: 'text-warning-500',
    label: 'Under review',
    labelClass: 'text-warning-500',
    lineClass: 'bg-amber-200',
  },
  ACTION_REQUIRED: {
    icon: AlertCircle,
    iconClass: 'text-danger-500',
    label: 'Action required',
    labelClass: 'text-danger-500',
    lineClass: 'bg-red-200',
  },
  APPROVED: {
    icon: CheckCircle,
    iconClass: 'text-success-500',
    label: 'Approved',
    labelClass: 'text-success-500',
    lineClass: 'bg-emerald-200',
  },
  AUTO_GOLD: {
    icon: Star,
    iconClass: 'text-tier-gold',
    label: 'Gold — auto-verified',
    labelClass: 'text-tier-gold',
    lineClass: 'bg-amber-200',
  },
}

export function MilestoneItem({
  id,
  projectId,
  order,
  name,
  status,
  isHardGate,
  dueDate,
  hasSubmission,
}: Props) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon
  const isClickable = status !== 'LOCKED'

  const cardContent = (
    <div
      className={cn(
        'rounded-md border p-4 transition-colors',
        status === 'LOCKED'
          ? 'border-ink-100 bg-ink-25'
          : status === 'APPROVED' || status === 'AUTO_GOLD'
          ? 'border-ink-100 bg-white'
          : status === 'ACTION_REQUIRED'
          ? 'border-danger-500/30 bg-red-50/30'
          : status === 'UNDER_REVIEW'
          ? 'border-amber-200 bg-amber-50/30'
          : 'border-ink-200 bg-white hover:border-ink-300'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-medium text-ink-400 tabular-nums">
              {String(order).padStart(2, '0')}
            </span>
            {isHardGate && (
              <span className="text-[9px] font-semibold uppercase tracking-widest text-ink-300 border border-ink-200 px-1 rounded-sm">
                Gate
              </span>
            )}
          </div>
          <p
            className={cn(
              'text-sm font-semibold',
              status === 'LOCKED' ? 'text-ink-400' : 'text-ink-900'
            )}
          >
            {name}
          </p>
          <p className={cn('text-xs mt-0.5', config.labelClass)}>{config.label}</p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {hasSubmission && status !== 'APPROVED' && status !== 'AUTO_GOLD' && (
            <span className="text-[10px] text-ink-400">1 submission</span>
          )}
          {dueDate &&
            status !== 'APPROVED' &&
            status !== 'AUTO_GOLD' &&
            status !== 'LOCKED' && (
              <span className="text-[10px] text-ink-400">
                Due{' '}
                {new Date(dueDate).toLocaleDateString('en-ZA', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            )}
          {isClickable && (
            <ChevronRight
              className="h-4 w-4 text-ink-300 group-hover:text-ink-500 transition-colors"
              strokeWidth={1.5}
            />
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex gap-4">
      {/* Timeline spine */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className={cn(
            'h-8 w-8 rounded-full border-2 flex items-center justify-center flex-shrink-0',
            status === 'LOCKED'
              ? 'border-ink-100 bg-white'
              : status === 'APPROVED' || status === 'AUTO_GOLD'
              ? 'border-transparent bg-white'
              : 'border-ink-200 bg-white'
          )}
        >
          <Icon className={cn('h-4 w-4', config.iconClass)} strokeWidth={1.5} />
        </div>
        <div className={cn('w-0.5 flex-1 mt-1 min-h-[24px]', config.lineClass)} />
      </div>

      {/* Content */}
      {isClickable ? (
        <Link
          href={`/contractor/projects/${projectId}/milestones/${id}`}
          className="flex-1 pb-6 group"
        >
          {cardContent}
        </Link>
      ) : (
        <div className="flex-1 pb-6">{cardContent}</div>
      )}
    </div>
  )
}
