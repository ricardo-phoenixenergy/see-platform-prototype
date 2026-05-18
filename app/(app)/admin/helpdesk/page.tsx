const EXAMPLE_TICKETS = [
  { id: 't1', ref: 'HLP-001', subject: 'Cannot upload CIPC document', company: 'Ntaba Solar', status: 'Open', created: '2026-05-14' },
  { id: 't2', ref: 'HLP-002', subject: 'Token balance not updated after tutorial', company: 'SunTec Installations', status: 'Closed', created: '2026-05-12' },
  { id: 't3', ref: 'HLP-003', subject: 'Milestone marked locked when it should be available', company: 'Adebayo Renewables', status: 'Open', created: '2026-05-16' },
]

export default function HelpdeskPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Helpdesk</h2>
        <p className="text-sm text-ink-500">Support tickets from platform users.</p>
      </div>

      <div className="rounded-lg border border-ink-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ink-25 border-b border-ink-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Ref</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Subject</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Company</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50">
            {EXAMPLE_TICKETS.map((t) => (
              <tr key={t.id} className="hover:bg-ink-25 transition-colors">
                <td className="px-4 py-3 font-medium text-ink-900">{t.ref}</td>
                <td className="px-4 py-3 text-ink-700">{t.subject}</td>
                <td className="px-4 py-3 text-ink-500">{t.company}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm ${
                    t.status === 'Open' ? 'bg-accent-500/10 text-accent-600' : 'bg-ink-100 text-ink-500'
                  }`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-ink-500">{t.created}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
