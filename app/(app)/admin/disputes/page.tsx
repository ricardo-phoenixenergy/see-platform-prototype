import { Scale } from 'lucide-react'

const EXAMPLE_DISPUTE = {
  id: 'ex-1',
  ref: 'DIS-2026-001',
  type: 'Milestone rejection contested',
  parties: 'Adebayo Renewables vs. Platform Admin',
  status: 'Under review',
  opened: '2026-05-10',
}

export default function DisputesPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Disputes</h2>
        <p className="text-sm text-ink-500">Active dispute resolution cases.</p>
      </div>

      <div className="rounded-lg border border-ink-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ink-25 border-b border-ink-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Ref</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Parties</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Opened</th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-ink-25 transition-colors">
              <td className="px-4 py-3 font-medium text-ink-900">{EXAMPLE_DISPUTE.ref}</td>
              <td className="px-4 py-3 text-ink-600">{EXAMPLE_DISPUTE.type}</td>
              <td className="px-4 py-3 text-ink-500 text-xs">{EXAMPLE_DISPUTE.parties}</td>
              <td className="px-4 py-3">
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-warning-50 text-warning-700">
                  {EXAMPLE_DISPUTE.status}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-ink-500">{EXAMPLE_DISPUTE.opened}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-center py-8 text-center text-ink-400">
        <Scale className="h-8 w-8 mb-2" strokeWidth={1.5} />
        <p className="text-sm">Full dispute resolution workflow coming in a future release.</p>
      </div>
    </div>
  )
}
