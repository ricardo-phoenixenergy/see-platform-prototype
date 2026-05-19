export default function Loading() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="h-8 w-48 rounded-md bg-ink-100 animate-pulse mb-6" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-52 rounded-lg border border-ink-100 bg-ink-50 animate-pulse" />
        ))}
      </div>
    </div>
  )
}
