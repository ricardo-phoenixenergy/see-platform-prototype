import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getEpcCommissions, getEpcLicensesSold } from '@/server/queries/payments'
import { formatZAR } from '@/lib/payments/rail'
import { Coins, TrendingUp, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmtMonth(d: Date) {
  return `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`
}

export default async function WalletPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const companyId = session.user.companyId

  const [wallet, tokenTxs, { commissions, totalEarned, accrued }, licensesSold] = await Promise.all([
    db.walletBalance.findUnique({ where: { companyId }, select: { tokens: true, fiatCents: true } }),
    db.tokenTransaction.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    getEpcCommissions(companyId),
    getEpcLicensesSold(companyId),
  ])

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-base font-semibold text-ink-900">Wallet</h1>
        <p className="text-sm text-ink-500">Tokens, commissions, and transaction history.</p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-ink-200 bg-white px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <Coins className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
            <span className="text-xs text-ink-500">SEE Tokens</span>
          </div>
          <p className="text-2xl font-semibold text-ink-900 tabular-nums">{(wallet?.tokens ?? 0).toLocaleString()}</p>
          <p className="text-xs text-ink-400 mt-0.5">Used for AI verification, expert review</p>
        </div>

        <div className="rounded-lg border border-ink-200 bg-white px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
            <span className="text-xs text-ink-500">Commission accrued</span>
          </div>
          <p className="text-2xl font-semibold text-ink-900 tabular-nums">{formatZAR(accrued)}</p>
          <p className="text-xs text-ink-400 mt-0.5">Next payout end of month</p>
        </div>

        <div className="rounded-lg border border-ink-200 bg-white px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
            <span className="text-xs text-ink-500">Total commission earned</span>
          </div>
          <p className="text-2xl font-semibold text-ink-900 tabular-nums">{formatZAR(totalEarned)}</p>
          <p className="text-xs text-ink-400 mt-0.5">Lifetime across all licenses</p>
        </div>
      </div>

      {/* Licenses sold (reseller section) */}
      {licensesSold.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-ink-900">Licenses sold</h2>
          <div className="rounded-lg border border-ink-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ink-25 border-b border-ink-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Tier</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-ink-500">Monthly fee</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-ink-500">Your commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {licensesSold.map((lic) => (
                  <tr key={lic.id}>
                    <td className="px-4 py-3 font-medium text-ink-900 text-xs">{lic.project.name}</td>
                    <td className="px-4 py-3 text-ink-500 text-xs">{lic.licenseeCompany.name}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-accent-500/10 text-accent-600">{lic.tier}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-ink-600 text-xs tabular-nums">{formatZAR(lic.monthlyFeeCents)}</td>
                    <td className="px-4 py-3 text-right text-success-600 text-xs font-semibold tabular-nums">
                      {formatZAR(Math.round(lic.monthlyFeeCents * (lic.commissionRate ?? 0.2)))}/mo
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Commission history */}
      {commissions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-ink-900">Commission history</h2>
          <div className="space-y-2">
            {commissions.map((c) => (
              <div key={c.id} className="flex items-center gap-4 rounded-lg border border-ink-200 bg-white px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-ink-900">{c.license.project.name}</p>
                  <p className="text-[10px] text-ink-400">{fmtMonth(c.period)} · {c.license.tier} tier</p>
                </div>
                <span className={cn(
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded-sm flex-shrink-0',
                  c.status === 'PAID' ? 'bg-success-500/10 text-success-600' :
                  c.status === 'ACCRUED' ? 'bg-ink-100 text-ink-600' :
                  'bg-warning-50 text-warning-700'
                )}>
                  {c.status}
                </span>
                <p className="text-xs font-semibold text-ink-900 tabular-nums flex-shrink-0">{formatZAR(c.amountCents)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Token transaction history */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-ink-900">Token transactions</h2>
        {tokenTxs.length === 0 ? (
          <p className="text-sm text-ink-500">No token transactions yet.</p>
        ) : (
          <div className="space-y-1">
            {tokenTxs.map((tx) => (
              <div key={tx.id} className="flex items-center gap-4 rounded-md border border-ink-100 bg-ink-25 px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink-700">{tx.description}</p>
                  <p className="text-[10px] text-ink-400">{new Date(tx.createdAt).toLocaleDateString('en-ZA')}</p>
                </div>
                <p className={cn('text-xs font-semibold tabular-nums flex-shrink-0', tx.amount > 0 ? 'text-success-600' : 'text-ink-600')}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
