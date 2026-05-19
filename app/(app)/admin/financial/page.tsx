import { getPaymentsForReconciliation } from '@/server/queries/payments'
import { ReconciliationQueue } from '@/components/admin/reconciliation-queue'
import { db } from '@/lib/db'
import { BarChart3 } from 'lucide-react'

export default async function FinancialPage() {
  const [pendingPayments, invoiceCount, paidCount] = await Promise.all([
    getPaymentsForReconciliation(),
    db.invoice.count(),
    db.invoice.count({ where: { status: 'PAID' } }),
  ])

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Financial &amp; Reconciliation</h2>
        <p className="text-sm text-ink-500">EFT proof of payment review queue and invoice overview.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending reconciliation', value: pendingPayments.length, highlight: pendingPayments.length > 0 },
          { label: 'Total invoices', value: invoiceCount, highlight: false },
          { label: 'Paid invoices', value: paidCount, highlight: false },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-lg border px-4 py-5 ${stat.highlight && stat.value > 0 ? 'border-warning-400 bg-warning-50/30' : 'border-ink-200 bg-white'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
              <span className="text-xs text-ink-500">{stat.label}</span>
            </div>
            <p className="text-2xl font-semibold text-ink-900 tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-ink-900">
          Awaiting reconciliation ({pendingPayments.length})
        </h3>

        {pendingPayments.length === 0 && (
          <div className="rounded-lg border border-ink-100 bg-ink-25 px-4 py-8 text-center">
            <p className="text-sm text-ink-500">No payments awaiting reconciliation.</p>
          </div>
        )}

        {pendingPayments.length > 0 && (
          <ReconciliationQueue payments={pendingPayments} />
        )}
      </div>
    </div>
  )
}
