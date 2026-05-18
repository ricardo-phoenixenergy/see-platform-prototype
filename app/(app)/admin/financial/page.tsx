import { db } from '@/lib/db'
import { BarChart3 } from 'lucide-react'

export default async function FinancialPage() {
  const [invoiceCount, paymentCount] = await Promise.all([
    db.invoice.count(),
    db.payment.count(),
  ])

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Financial & Escrow</h2>
        <p className="text-sm text-ink-500">Read-only financial overview. Full reconciliation tools available in M9.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total invoices', value: invoiceCount },
          { label: 'Total payments', value: paymentCount },
          { label: 'Escrow holds', value: '—' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-ink-200 bg-white px-4 py-5">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
              <span className="text-xs text-ink-500">{stat.label}</span>
            </div>
            <p className="text-2xl font-semibold text-ink-900 tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-md border border-ink-100 bg-ink-25 px-4 py-3">
        <p className="text-xs text-ink-500">
          Full EFT reconciliation queue, escrow management, and commission payout batch will be added in M9 (Payments, Licensing & Wallet).
        </p>
      </div>
    </div>
  )
}
