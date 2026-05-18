import { cn } from '@/lib/utils'

type Props = React.HTMLAttributes<HTMLDivElement>

function Card({ className, ...props }: Props) {
  return (
    <div
      className={cn('rounded-md border border-ink-200 bg-white shadow-xs', className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: Props) {
  return <div className={cn('flex flex-col gap-1 p-6', className)} {...props} />
}

function CardTitle({ className, ...props }: Props) {
  return <h3 className={cn('text-base font-semibold text-ink-900 tracking-tight', className)} {...props} />
}

function CardContent({ className, ...props }: Props) {
  return <div className={cn('px-6 pb-6', className)} {...props} />
}

export { Card, CardHeader, CardTitle, CardContent }
