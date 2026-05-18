import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:shadow-ring rounded-md',
  {
    variants: {
      variant: {
        primary: 'bg-ink-900 text-white hover:bg-ink-800',
        secondary: 'bg-white text-ink-900 border border-ink-200 hover:bg-ink-50',
        accent: 'bg-accent-500 text-white hover:bg-accent-600',
        ghost: 'text-ink-700 hover:bg-ink-50 hover:text-ink-900',
        link: 'text-accent-600 hover:text-accent-700 underline-offset-4 hover:underline rounded-none',
        danger: 'bg-danger-500 text-white hover:bg-red-600',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean
    asChild?: boolean
  }

const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant, size, loading, children, disabled, asChild: _asChild, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
)
Button.displayName = 'Button'
export { Button, buttonVariants }
