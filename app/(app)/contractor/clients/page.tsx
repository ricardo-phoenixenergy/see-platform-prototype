import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getClients } from '@/server/queries/clients'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { cn, formatDate } from '@/lib/utils'
import { Users, Plus, Building2 } from 'lucide-react'

export default async function ClientsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const clients = await getClients(session.user.companyId)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Clients</h1>
          <p className="text-sm text-ink-500 mt-1">
            {clients.length} client{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/contractor/clients/new"
          className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'inline-flex items-center gap-1.5')}
        >
          <Plus className="h-4 w-4" />
          New client
        </Link>
      </div>

      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add your first client, then attach projects to them."
          action={{ label: 'New client', href: '/contractor/clients/new' }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/contractor/clients/${client.id}`}
              className="rounded-lg border border-ink-200 bg-white p-5 hover:border-ink-300 hover:shadow-sm transition-all flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="h-9 w-9 rounded-md bg-ink-100 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-4 w-4 text-ink-500" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-sm bg-ink-100 text-ink-500 flex-shrink-0">
                  {client._count.projects} project{client._count.projects !== 1 ? 's' : ''}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900 leading-tight">{client.name}</p>
                {client.industry && (
                  <p className="text-xs text-ink-500 mt-0.5">{client.industry}</p>
                )}
                {client.contactName && (
                  <p className="text-xs text-ink-400 mt-1">{client.contactName}</p>
                )}
              </div>
              <p className="text-[10px] text-ink-400 mt-auto">
                Added {formatDate(client.createdAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
