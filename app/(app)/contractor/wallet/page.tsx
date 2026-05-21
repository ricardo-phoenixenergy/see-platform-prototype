import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getEpcCommissions, getEpcLicensesSold } from '@/server/queries/payments'
import { formatZAR } from '@/lib/payments/rail'
import { TrendingUp, DollarSign } from 'lucide-react'

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function fmtMonth(d: Date) {
  return `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`
}

export default async function WalletPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const companyId = session.user.companyId
  const [{ commissions, totalEarned, accrued }, licensesSold] = await Promise.all([
    getEpcCommissions(companyId),
    getEpcLicensesSold(companyId),
  ])

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 overflow-y-auto h-full">
      <div>
        <h1 className="text-base font-semibold text-ink-900">Commissions &amp; earnings</h1>
        <p className="text-sm text-ink-500 mt-0.5">O&amp;M license commissions earned from client activations.</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { icon: DollarSign,  label: 'Total earned',     value: formatZAR(totalEarned)  },
          { icon: TrendingUp,  label: 'Accrued (unpaid)', value: formatZAR(accrued)      },
          { icon: DollarSign,  label: 'Licenses sold',    value: String(licensesSold.length) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-lg border border-ink-200 bg-white px-4 py-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="h-3.5 w-3.5 text-ink-400" strokeWidth={1.5} />
              <p className="text-xs text-ink-500">{label}</p>
            </div>
            <p className="text-xl font-semibold text-ink-900 tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Commission history */}
      <div className="rounded-lg border border-ink-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-ink-100 bg-ink-25">
          <p className="text-xs font-semibold text-ink-700">Commission history</p>
        </div>
        {commissions.length === 0 ? (
          <p className="px-5 py-4 text-sm text-ink-500">No commissions yet — activate a client O&amp;M license to start earning.</p>
        ) : (
          <div className="divide-y divide-ink-100">
            {commissions.map(c => (
              <div key={c.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm text-ink-900">{c.license.project.name}</p>
                  <p className="text-xs text-ink-400">{fmtMonth(c.period)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-ink-900">{formatZAR(c.amountCents)}</p>
                  <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-sm ${
                    c.status === 'PAID' ? 'bg-ink-100 text-ink-600' : 'bg-ink-100 text-ink-400'
                  }`}>{c.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
