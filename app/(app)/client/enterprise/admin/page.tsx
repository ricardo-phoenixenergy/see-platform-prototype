import { Users, FileText, BarChart3 } from 'lucide-react'

const SEATS = [
  { name: 'Sipho Dlamini', email: 'sipho@spazaholdings.co.za', role: 'ENTERPRISE_ADMIN', lastActive: '2026-05-18', status: 'ACTIVE' },
  { name: 'Nomsa Zulu', email: 'nomsa@spazaholdings.co.za', role: 'ENTERPRISE_FINANCE', lastActive: '2026-05-16', status: 'ACTIVE' },
  { name: 'Thabo Nkosi', email: 'thabo@spazaholdings.co.za', role: 'ENTERPRISE_OPS', lastActive: '2026-05-15', status: 'ACTIVE' },
  { name: 'Palesa Mokoena', email: 'palesa@spazaholdings.co.za', role: 'ENTERPRISE_VIEWER', lastActive: '2026-05-10', status: 'ACTIVE' },
]

const ROLE_LABEL: Record<string, string> = {
  ENTERPRISE_ADMIN: 'Admin', ENTERPRISE_FINANCE: 'Finance',
  ENTERPRISE_OPS: 'Operations', ENTERPRISE_VIEWER: 'Viewer',
}

export default function EnterpriseAdminPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Admin</h2>
        <p className="text-sm text-ink-500">Seats, contract details, and usage for your Enterprise license.</p>
      </div>

      {/* Seats */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
            <h3 className="text-sm font-semibold text-ink-900">Seats</h3>
          </div>
          <p className="text-xs text-ink-500">Using 4 of 10 seats. Adding more seats increases monthly fee.</p>
        </div>
        <div className="rounded-lg border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink-25 border-b border-ink-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Last active</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {SEATS.map((seat) => (
                <tr key={seat.email} className="hover:bg-ink-25">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900">{seat.name}</p>
                    <p className="text-xs text-ink-400">{seat.email}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-500 text-xs">{ROLE_LABEL[seat.role] ?? seat.role}</td>
                  <td className="px-4 py-3 text-xs text-ink-500">{new Date(seat.lastActive).toLocaleDateString('en-ZA')}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-success-500/10 text-success-600">{seat.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="h-7 px-3 rounded-md border border-ink-200 text-ink-600 text-xs hover:bg-ink-50 transition-colors">
          Invite seat
        </button>
      </div>

      {/* Contract details */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-ink-900">Contract details</h3>
        </div>
        <div className="rounded-lg border border-ink-200 bg-white px-5 py-4 space-y-2 text-sm">
          {[
            { label: 'Contract reference', value: 'ENT-2025-SPAZA-001' },
            { label: 'Start date', value: '1 November 2025' },
            { label: 'Review cadence', value: 'Annual (next: November 2026)' },
            { label: 'Pricing structure', value: 'R 8,500 base + R 250/seat + R 1,200/integration' },
          ].map((row) => (
            <div key={row.label} className="flex justify-between">
              <span className="text-ink-500">{row.label}</span>
              <span className="font-medium text-ink-900">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Usage this period */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-ink-900">Usage this period</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'API calls', value: '47,392', of: '500,000' },
            { label: 'Webhook deliveries', value: '1,284', of: '—' },
            { label: 'Data exports', value: '18', of: '—' },
            { label: 'Active seats', value: '4', of: '10' },
          ].map((m) => (
            <div key={m.label} className="rounded-lg border border-ink-200 bg-white px-4 py-3">
              <p className="text-xs text-ink-500">{m.label}</p>
              <p className="text-xl font-semibold text-ink-900 tabular-nums mt-0.5">{m.value}</p>
              {m.of !== '—' && <p className="text-[10px] text-ink-400">of {m.of}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
