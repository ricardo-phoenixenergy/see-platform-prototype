import { Skeleton } from '@/components/ui/skeleton'

export default function ClientPortfolioPage() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-md" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-md" />
      <p className="text-sm text-ink-500">Client portfolio dashboard coming in Phase 2 (M6)</p>
    </div>
  )
}
