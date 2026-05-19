import { getEnterpriseLicenses, getProjectsNotInEnterpriseScope } from '@/server/queries/payments'
import { EnterpriseAccountsView } from '@/components/admin/enterprise-accounts-view'
import { formatZAR } from '@/lib/payments/rail'

export default async function EnterpriseAccountsPage() {
  const licenses = await getEnterpriseLicenses()

  // For each license, fetch projects eligible for scope addition
  const licensesWithEligible = await Promise.all(
    licenses.map(async (lic) => ({
      license: lic,
      eligibleProjects: await getProjectsNotInEnterpriseScope(lic.id, lic.clientCompany.id),
    }))
  )

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Enterprise Accounts</h2>
        <p className="text-sm text-ink-500">
          {licenses.length} Enterprise license{licenses.length !== 1 ? 's' : ''}.
        </p>
      </div>

      {licenses.length === 0 && (
        <div className="rounded-lg border border-ink-100 bg-ink-25 px-4 py-8 text-center">
          <p className="text-sm text-ink-500">No Enterprise licenses yet.</p>
        </div>
      )}

      <div className="space-y-4">
        {licensesWithEligible.map(({ license: lic, eligibleProjects }) => {
          const activeSeats = lic.seats.filter((s) => s.isActive).length
          const activeIntegrations = lic.integrations.filter((i) => i.status === 'ACTIVE').length
          const baseMonthly = lic.baseMonthlyFeeCents + lic.perSeatMonthlyFeeCents * activeSeats

          return (
            <div key={lic.id} className="rounded-lg border border-ink-200 bg-white p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-ink-900">{lic.clientCompany.name}</p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm ${lic.status === 'ACTIVE' ? 'bg-success-500/10 text-success-600' : 'bg-ink-100 text-ink-600'}`}>
                      {lic.status}
                    </span>
                  </div>
                  <p className="text-xs text-ink-500 mt-0.5">
                    {lic.contractReference} · {activeSeats} seat{activeSeats !== 1 ? 's' : ''} · {activeIntegrations} integration{activeIntegrations !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-ink-900">{formatZAR(baseMonthly)}/mo base</p>
                  <p className="text-xs text-ink-400">{lic.reviewCadence.toLowerCase()} review</p>
                </div>
              </div>

              {/* Project scopes */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-ink-700">
                  Projects in scope ({lic.projectScopes.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {lic.projectScopes.map((scope) => (
                    <span
                      key={scope.project.id}
                      className="text-[10px] font-medium px-2 py-1 rounded-md border border-ink-200 bg-ink-25 text-ink-600"
                    >
                      {scope.project.name} · {scope.project.site?.city}
                    </span>
                  ))}
                  {lic.projectScopes.length === 0 && (
                    <p className="text-xs text-ink-400">No projects in scope yet.</p>
                  )}
                </div>
              </div>

              {/* Add project to scope (Act 4 demo moment) */}
              {eligibleProjects.length > 0 && (
                <EnterpriseAccountsView
                  licenseId={lic.id}
                  eligibleProjects={eligibleProjects}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
