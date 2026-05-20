// components/shell/topbar.tsx
// Server component — passes user data down to TopbarActions (client).

import { auth } from '@/lib/auth'
import { getInitials } from '@/lib/utils'
import { TopbarActions } from './topbar-actions'

const ROLE_LABELS: Record<string, string> = {
  CONTRACTOR: 'Contractor',
  SERVICE_PROVIDER: 'Service Provider',
  CLIENT: 'Client',
  ADMIN: 'Platform Admin',
}

export async function Topbar() {
  const session = await auth()
  const name = session?.user.name ?? ''
  const email = session?.user.email ?? ''
  const role = session?.user.role ?? ''
  const initials = getInitials(name)
  const roleLabel = ROLE_LABELS[role] ?? role

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-ink-200 bg-white/95 backdrop-blur-sm flex items-center px-5 gap-4 flex-shrink-0">
      <div className="flex-1" />
      <TopbarActions initials={initials} name={name} email={email} roleLabel={roleLabel} />
    </header>
  )
}
