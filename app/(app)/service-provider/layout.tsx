import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/shell/topbar'
import { Sidebar, SERVICE_PROVIDER_NAV } from '@/components/shell/sidebar'

export default async function ServiceProviderLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== 'SERVICE_PROVIDER') redirect('/login')

  return (
    <div className="flex h-screen bg-ink-25">
      <Sidebar navItems={SERVICE_PROVIDER_NAV} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
