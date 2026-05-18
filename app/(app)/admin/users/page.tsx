import { getAllUsersAndCompanies } from '@/server/queries/admin'
import { TierOverrideSelect } from '@/components/admin/tier-override-select'
import { cn } from '@/lib/utils'

const TIER_COLOURS: Record<string, string> = {
  BRONZE: '#A56A3E', SILVER: '#8B95A0', GOLD: '#C9A03E', PLATINUM: '#6E7A8A',
}

export default async function UsersPage() {
  const companies = await getAllUsersAndCompanies()

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Users & Companies</h2>
        <p className="text-sm text-ink-500">{companies.length} companies on the platform.</p>
      </div>

      <div className="rounded-lg border border-ink-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ink-25 border-b border-ink-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Company</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">KYC</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Tier</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Members</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Override tier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50">
            {companies.map((company) => {
              const kycStatus = company.kycSubmissions[0]?.status ?? null
              const tier = company.tierStatus?.tier ?? null
              const colour = tier ? (TIER_COLOURS[tier] ?? '#8B95A0') : null
              return (
                <tr key={company.id} className="hover:bg-ink-25 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900">{company.name}</p>
                    <p className="text-xs text-ink-400">{company.registrationNo ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-500">{company.type}</td>
                  <td className="px-4 py-3">
                    {kycStatus ? (
                      <span className={cn(
                        'text-[10px] font-semibold px-1.5 py-0.5 rounded-sm',
                        kycStatus === 'APPROVED' ? 'bg-success-500/10 text-success-600' :
                        kycStatus === 'REJECTED' ? 'bg-danger-500/10 text-danger-600' :
                        'bg-ink-100 text-ink-600'
                      )}>
                        {kycStatus}
                      </span>
                    ) : <span className="text-xs text-ink-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {tier ? (
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm"
                        style={{ color: colour!, backgroundColor: `${colour!}18`, border: `1px solid ${colour!}40` }}
                      >
                        {tier}
                      </span>
                    ) : <span className="text-xs text-ink-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-500 max-w-[200px] truncate">
                    {company.memberships.map((m) => m.user.name ?? m.user.email).join(', ')}
                  </td>
                  <td className="px-4 py-3">
                    {tier && (
                      <TierOverrideSelect companyId={company.id} currentTier={tier} />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
