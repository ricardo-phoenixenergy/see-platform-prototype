import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/shell/topbar'
import { Sidebar, CLIENT_NAV, ENTERPRISE_CLIENT_NAV } from '@/components/shell/sidebar'
import { isEnterpriseCompany } from '@/server/queries/client'

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== 'CLIENT') redirect('/login')

  const isEnterprise = isEnterpriseCompany(session.user.companyId)

  return (
    <div className="flex h-screen bg-ink-25 overflow-hidden">
      <Sidebar navItems={isEnterprise ? ENTERPRISE_CLIENT_NAV : CLIENT_NAV} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
