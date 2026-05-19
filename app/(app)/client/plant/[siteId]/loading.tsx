export default function Loading() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="h-10 w-72 rounded-md bg-ink-100 animate-pulse" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-ink-100 animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-52 rounded-lg bg-ink-100 animate-pulse" />
        ))}
      </div>
    </div>
  )
}
