import { getAdminStats } from '@/server/queries/admin'
import { db } from '@/lib/db'
import { ClipboardList, Building2, FolderOpen, Users } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default async function AdminDashboardPage() {
  const [stats, recentSubmissions, recentKyc] = await Promise.all([
    getAdminStats(),
    db.milestoneSubmission.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        milestone: {
          select: {
            name: true,
            project: { select: { name: true, contractorCompany: { select: { name: true } } } },
          },
        },
      },
    }),
    db.kycSubmission.findMany({
      take: 4,
      where: { status: 'PENDING' },
      include: { company: { select: { name: true, type: true } } },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const statCards = [
    { label: 'Total users', value: stats.totalUsers, icon: Users, href: '/admin/users', alert: false },
    { label: 'Total companies', value: stats.totalCompanies, icon: Building2, href: '/admin/users', alert: false },
    { label: 'Total projects', value: stats.totalProjects, icon: FolderOpen, href: '/admin/users', alert: false },
    { label: 'KYC pending', value: stats.kycPending, icon: ClipboardList, href: '/admin/kyc', alert: stats.kycPending > 0 },
    { label: 'Submissions pending', value: stats.submissionsPending, icon: ClipboardList, href: '/admin/submissions', alert: stats.submissionsPending > 0 },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Admin</h1>
        <p className="text-sm text-ink-500 mt-1">Platform overview and queue management.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.label}
              href={card.href}
              className={cn(
                'rounded-lg border bg-white px-4 py-5 hover:border-ink-300 transition-colors',
                card.alert ? 'border-accent-400 bg-accent-500/5' : 'border-ink-200'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn('h-4 w-4', card.alert ? 'text-accent-500' : 'text-ink-400')} strokeWidth={1.5} />
                <span className="text-xs text-ink-500">{card.label}</span>
              </div>
              <p className={cn('text-2xl font-semibold tabular-nums', card.alert ? 'text-accent-600' : 'text-ink-900')}>
                {card.value}
              </p>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent submissions */}
        <div className="rounded-lg border border-ink-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-900">Recent submissions</h2>
            <Link href="/admin/submissions" className="text-xs text-accent-600 hover:underline">View queue</Link>
          </div>
          <ul className="divide-y divide-ink-50">
            {recentSubmissions.length === 0 && (
              <li className="px-4 py-6 text-sm text-ink-400 text-center">No submissions yet.</li>
            )}
            {recentSubmissions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/admin/submissions/${s.id}`}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-ink-25 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{s.milestone.name}</p>
                    <p className="text-xs text-ink-500 truncate">
                      {s.milestone.project.contractorCompany.name} — {s.milestone.project.name}
                    </p>
                  </div>
                  <span className={cn(
                    'text-[10px] font-semibold px-1.5 py-0.5 rounded-sm flex-shrink-0',
                    s.status === 'PENDING' ? 'bg-ink-100 text-ink-600' :
                    s.status === 'UNDER_REVIEW' ? 'bg-accent-500/10 text-accent-600' :
                    s.status === 'APPROVED' ? 'bg-success-500/10 text-success-600' :
                    'bg-danger-500/10 text-danger-600'
                  )}>
                    {s.status.replace('_', ' ')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* KYC pending */}
        <div className="rounded-lg border border-ink-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-900">KYC pending</h2>
            <Link href="/admin/kyc" className="text-xs text-accent-600 hover:underline">View queue</Link>
          </div>
          <ul className="divide-y divide-ink-50">
            {recentKyc.length === 0 && (
              <li className="px-4 py-6 text-sm text-ink-400 text-center">No pending KYC reviews.</li>
            )}
            {recentKyc.map((k) => (
              <li key={k.id}>
                <Link
                  href="/admin/kyc"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-ink-25 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{k.company.name}</p>
                    <p className="text-xs text-ink-500">{k.company.type}</p>
                  </div>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-warning-50 text-warning-700 flex-shrink-0">
                    PENDING
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
