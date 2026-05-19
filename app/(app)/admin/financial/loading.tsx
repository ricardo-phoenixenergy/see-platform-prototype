export default function Loading() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="h-8 w-56 rounded-md bg-ink-100 animate-pulse" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-ink-100 animate-pulse" />
        ))}
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 rounded-lg border border-ink-100 bg-ink-50 animate-pulse" />
      ))}
    </div>
  )
}
