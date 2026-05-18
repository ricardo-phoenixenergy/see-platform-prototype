import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-xs px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-ink-100 text-ink-700',
        accent: 'bg-accent-50 text-accent-700',
        success: 'bg-emerald-50 text-emerald-700',
        warning: 'bg-amber-50 text-amber-700',
        danger: 'bg-red-50 text-red-700',
        outline: 'border border-ink-200 text-ink-600',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

type Props = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>

function Badge({ className, variant, ...props }: Props) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
