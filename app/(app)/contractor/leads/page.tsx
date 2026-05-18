import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getTierInfo } from '@/server/queries/dashboard'
import { Lock, TrendingUp } from 'lucide-react'
import { CashbackRates } from '@/components/tier/cashback-rates'

export default async function LeadsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const { tier } = await getTierInfo(session.user.companyId)
  const isLocked = tier === 'BRONZE'

  if (!isLocked) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h2 className="text-base font-semibold text-ink-900 mb-1">Leads</h2>
        <p className="text-sm text-ink-500 mb-6">Inbound project leads from clients on the platform.</p>
        <div className="flex flex-col items-center py-16 text-center">
          <TrendingUp className="h-8 w-8 text-ink-300 mb-3" strokeWidth={1.5} />
          <p className="text-sm font-medium text-ink-900">Leads coming soon</p>
          <p className="text-xs text-ink-500 mt-1">Client project leads will appear here as the platform grows.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink-900 mb-1">Leads</h2>
        <p className="text-sm text-ink-500">Inbound project leads from clients on the platform.</p>
      </div>

      <div className="rounded-lg border border-ink-200 bg-ink-25 px-8 py-10 flex flex-col items-center text-center gap-4">
        <div className="h-12 w-12 rounded-full bg-ink-100 flex items-center justify-center">
          <Lock className="h-5 w-5 text-ink-400" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-900">Silver tier required</p>
          <p className="text-sm text-ink-500 mt-1 max-w-sm">
            Inbound client leads are available from Silver tier upwards. Complete 3 compliant projects to unlock.
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-400 mb-3">Tier benefits</h3>
        <CashbackRates currentTier={tier} />
      </div>
    </div>
  )
}
