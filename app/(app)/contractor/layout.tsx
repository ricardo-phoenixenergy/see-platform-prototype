import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/shell/topbar'
import { Sidebar, CONTRACTOR_NAV } from '@/components/shell/sidebar'
import { getTierInfo } from '@/server/queries/dashboard'
import { TierUpAnimation } from '@/components/tier/tier-up-animation'
import { ChatWidget } from '@/components/ai/chat-widget'

export default async function ContractorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== 'CONTRACTOR') redirect('/login')

  const tierInfo = await getTierInfo(session.user.companyId)

  return (
    <div className="flex h-screen bg-ink-25 overflow-hidden">
      <Sidebar navItems={CONTRACTOR_NAV} tierInfo={tierInfo} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      <Suspense fallback={null}>
        <TierUpAnimation />
      </Suspense>
      <ChatWidget />
    </div>
  )
}
