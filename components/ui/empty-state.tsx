import { type LucideIcon } from 'lucide-react'
import { Button } from './button'

type Props = {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="mb-3 h-8 w-8 text-ink-400" strokeWidth={1.5} />
      <p className="mb-1 text-base font-semibold text-ink-900">{title}</p>
      <p className="mb-4 max-w-xs text-sm text-ink-600">{description}</p>
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  )
}
