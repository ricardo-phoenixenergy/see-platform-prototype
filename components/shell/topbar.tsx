import { auth } from '@/lib/auth'
import { Bell } from 'lucide-react'
import { getInitials } from '@/lib/utils'

export async function Topbar() {
  const session = await auth()
  const name = session?.user.name ?? ''
  const initials = getInitials(name)

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-ink-200 bg-white/95 backdrop-blur-sm flex items-center px-5 gap-4 flex-shrink-0">
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <button
          className="rounded-md p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink-700 transition-colors focus-visible:outline-none"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <div className="h-[1px] w-4 bg-ink-200 rotate-90" />
        <div
          className="h-7 w-7 rounded-full bg-ink-100 flex items-center justify-center text-[10px] font-semibold text-ink-700 select-none flex-shrink-0"
          title={name}
        >
          {initials}
        </div>
      </div>
    </header>
  )
}
