type Stat = { label: string; value: string; sub?: string }
type Props = { stats: Stat[] }

export function StatsRow({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
      {stats.map(stat => (
        <div key={stat.label} className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-widest text-ink-400">
            {stat.label}
          </p>
          <p className="text-3xl font-semibold tracking-tight text-ink-900 tabular-nums">
            {stat.value}
          </p>
          {stat.sub && (
            <p className="text-xs text-ink-500">{stat.sub}</p>
          )}
        </div>
      ))}
    </div>
  )
}
