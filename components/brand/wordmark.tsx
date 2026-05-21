import { cn } from '@/lib/utils'

type Props = { className?: string; size?: 'sm' | 'md' | 'lg' }

const SIZE_CLASS = {
  sm: 'h-7',
  md: 'h-8',
  lg: 'h-10',
} as const

export function Wordmark({ className, size = 'md' }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/see-logo-horizontal.png"
      alt="SEE Platform"
      className={cn('w-auto object-contain select-none', SIZE_CLASS[size], className)}
    />
  )
}
