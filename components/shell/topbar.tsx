import { auth } from '@/lib/auth'
import { Wordmark } from '@/components/brand/wordmark'

export async function Topbar() {
  const session = await auth()
  const userName = session?.user.name ?? 'User'
  const role = session?.user.role ?? ''

  const roleLabel: Record<string, string> = {
    CONTRACTOR: 'Contractor',
    SERVICE_PROVIDER: 'Service Provider',
    CLIENT: 'End-Client',
    ADMIN: 'Platform Admin',
  }

  const initials = userName
    .split(' ')
    .map((n: string) => n[0] ?? '')
    .filter(Boolean)
    .slice(0, 2)
    .join('')

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-ink-200 bg-white flex items-center px-5 gap-4">
      <Wordmark size="sm" />
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <span className="text-xs text-ink-500">{roleLabel[role] ?? role}</span>
        <div className="h-7 w-7 rounded-full bg-ink-100 flex items-center justify-center text-xs font-medium text-ink-700 select-none">
          {initials}
        </div>
      </div>
    </header>
  )
}
