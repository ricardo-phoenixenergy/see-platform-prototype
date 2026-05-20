'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <AlertTriangle className="mb-4 h-10 w-10 text-ink-300" strokeWidth={1.5} />
      <p className="mb-1 text-base font-semibold text-ink-900">Something went wrong</p>
      <p className="mb-6 max-w-sm text-sm text-ink-500">
        An unexpected error occurred. Try refreshing the page, or go back to the dashboard.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className={buttonVariants({ variant: 'secondary', size: 'sm' })}
        >
          Try again
        </button>
        <Link href="/" className={buttonVariants({ variant: 'primary', size: 'sm' })}>
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
