import { Skeleton } from '@/components/ui/skeleton'

export default function ContractorDashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-md" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6">
        <Skeleton className="col-span-2 h-64 rounded-md" />
        <Skeleton className="h-64 rounded-md" />
      </div>
      <p className="text-sm text-ink-500">Dashboard coming in Phase 2 (M3)</p>
    </div>
  )
}
