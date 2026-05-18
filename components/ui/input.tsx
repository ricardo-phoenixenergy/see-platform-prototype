import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, Props>(
  ({ className, label, hint, error, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink-900">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-10 w-full rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 placeholder:text-ink-400',
            'focus:border-accent-500 focus:outline-none focus:shadow-ring',
            'disabled:bg-ink-50 disabled:text-ink-500',
            error && 'border-danger-500',
            className
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-ink-500">{hint}</p>}
        {error && <p className="text-xs text-danger-500">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
export { Input }
