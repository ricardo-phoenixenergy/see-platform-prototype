export default function Loading() {
  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto">
      <div className="h-8 w-48 rounded-md bg-ink-100 animate-pulse" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-28 rounded-lg border border-ink-100 bg-ink-50 animate-pulse" />
      ))}
    </div>
  )
}
