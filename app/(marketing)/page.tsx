import Link from 'next/link'
import { Wordmark } from '@/components/brand/wordmark'

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-ink-25 flex flex-col overflow-hidden">
      {/* Subtle dot lattice background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, #14161A 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <header className="relative z-10 px-8 pt-8">
        <Wordmark size="md" />
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="mb-3 text-xs font-medium tracking-widest uppercase text-ink-500">
          SEE Platform
        </p>
        <h1 className="mb-6 max-w-2xl text-4xl font-semibold tracking-tight text-ink-900 leading-[1.2]">
          The operating system for<br />energy project developers.
        </h1>
        <p className="mb-8 max-w-md text-base text-ink-600 leading-relaxed">
          From development to operations — one platform for every milestone,
          verification, and stakeholder in a renewable energy project.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-md bg-ink-900 px-6 text-base font-medium text-white transition-colors hover:bg-ink-800 focus-visible:outline-none focus-visible:shadow-ring"
          >
            Request access
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-md border border-ink-200 bg-white px-6 text-base font-medium text-ink-900 transition-colors hover:bg-ink-50 focus-visible:outline-none focus-visible:shadow-ring"
          >
            Sign in
          </Link>
        </div>
      </main>

      <footer className="relative z-10 px-8 py-6 text-xs text-ink-400">
        © 2026 SEE Platform. A joint venture between MW-GS Pty Ltd and Phoenix Energy Solutions.
      </footer>
    </div>
  )
}
