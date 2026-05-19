import { FileText, Download } from 'lucide-react'

const REPORTS = [
  { id: 'r1', name: 'Monthly Performance Report — April 2026', type: 'Monthly Performance', date: '2026-05-01', size: '1.2 MB' },
  { id: 'r2', name: 'Quarterly Carbon Report — Q1 2026', type: 'Quarterly Carbon', date: '2026-04-01', size: '890 KB' },
  { id: 'r3', name: 'Annual Maintenance Summary — 2025', type: 'Annual Maintenance', date: '2026-01-15', size: '3.4 MB' },
  { id: 'r4', name: 'Monthly Performance Report — March 2026', type: 'Monthly Performance', date: '2026-04-01', size: '1.1 MB' },
]

export default function EnterpriseReportsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Reports</h2>
        <p className="text-sm text-ink-500">{REPORTS.length} reports available.</p>
      </div>

      <div className="rounded-lg border border-ink-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ink-25 border-b border-ink-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Report</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Date</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-ink-500">Size</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50">
            {REPORTS.map((r) => (
              <tr key={r.id} className="hover:bg-ink-25 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-ink-400 flex-shrink-0" strokeWidth={1.5} />
                    <span className="text-ink-900 font-medium">{r.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-500">{r.type}</td>
                <td className="px-4 py-3 text-ink-500">{new Date(r.date).toLocaleDateString('en-ZA')}</td>
                <td className="px-4 py-3 text-right text-ink-400 text-xs">{r.size}</td>
                <td className="px-4 py-3 text-right">
                  <button className="flex items-center gap-1.5 text-xs text-accent-600 hover:underline ml-auto">
                    <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
