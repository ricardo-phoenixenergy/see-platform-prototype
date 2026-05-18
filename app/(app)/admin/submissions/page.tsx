import { getSubmissionsQueue } from '@/server/queries/admin'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ShieldCheck } from 'lucide-react'

export default async function SubmissionsQueuePage() {
  const submissions = await getSubmissionsQueue()

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Submissions Queue</h2>
        <p className="text-sm text-ink-500">Review milestone artefact submissions from contractors.</p>
      </div>

      {submissions.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-sm font-medium text-ink-900">No pending submissions</p>
          <p className="text-xs text-ink-500 mt-1">All submissions have been reviewed.</p>
        </div>
      )}

      {submissions.length > 0 && (
        <div className="rounded-lg border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink-25 border-b border-ink-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Milestone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Contractor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Verified</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Submitted</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {submissions.map((s) => (
                <tr key={s.id} className="hover:bg-ink-25 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900">{s.milestone.name}</p>
                    <p className="text-xs text-ink-500">{s.milestone.project.name}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{s.milestone.project.contractorCompany.name}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-[10px] font-semibold px-1.5 py-0.5 rounded-sm',
                      s.status === 'PENDING' ? 'bg-ink-100 text-ink-600' : 'bg-accent-500/10 text-accent-600'
                    )}>
                      {s.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {s.verifications.length > 0 ? (
                      <div className="flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-success-500" strokeWidth={1.5} />
                        <span className="text-xs text-ink-600">{s.verifications.length}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-ink-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-500">
                    {new Date(s.createdAt).toLocaleDateString('en-ZA')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/submissions/${s.id}`} className="text-xs text-accent-600 hover:underline font-medium">
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
