import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/shell/topbar'
import { Sidebar, CONTRACTOR_NAV } from '@/components/shell/sidebar'

export default async function ContractorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== 'CONTRACTOR') redirect('/login')

  return (
    <div className="flex h-screen bg-ink-25">
      <Sidebar navItems={CONTRACTOR_NAV} rolePrefix="contractor" />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
