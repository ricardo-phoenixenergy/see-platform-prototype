import Image from 'next/image'
import { cn } from '@/lib/utils'

type Props = { className?: string; size?: 'sm' | 'md' | 'lg' }

const SIZE_CLASS = {
  sm: 'h-7',
  md: 'h-8',
  lg: 'h-10',
} as const

export function Wordmark({ className, size = 'md' }: Props) {
  return (
    <Image
      src="/brand/SEE logo - Horizontal.png"
      alt="SEE Platform"
      width={200}
      height={60}
      className={cn('w-auto object-contain select-none', SIZE_CLASS[size], className)}
      priority
    />
  )
}
