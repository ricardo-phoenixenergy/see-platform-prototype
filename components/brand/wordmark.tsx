import { cn } from '@/lib/utils'

type Props = { className?: string; size?: 'sm' | 'md' | 'lg' }

export function Wordmark({ className, size = 'md' }: Props) {
  const sizes = { sm: 'text-lg', md: 'text-xl', lg: 'text-3xl' }
  return (
    <span
      className={cn(
        'font-semibold tracking-[-0.04em] text-ink-900 select-none',
        sizes[size],
        className
      )}
    >
      SEE
    </span>
  )
}
