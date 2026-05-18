import { Wordmark } from '@/components/brand/wordmark'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-25 flex flex-col items-center justify-center px-4 py-12">
      <Wordmark size="md" className="mb-8" />
      {children}
    </div>
  )
}
