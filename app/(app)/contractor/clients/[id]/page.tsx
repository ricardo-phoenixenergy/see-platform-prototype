import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getClientById } from '@/server/queries/clients'
import { ProjectCard } from '@/components/project/project-card'
import { EmptyState } from '@/components/ui/empty-state'
import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import { cn, formatDate } from '@/lib/utils'
import { Building2, Mail, Phone, User, FolderOpen, Plus } from 'lucide-react'

type Props = { params: Promise<{ id: string }> }

export default async function ClientDetailPage({ params }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const client = await getClientById(id, session.user.companyId)
  if (!client) notFound()

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-lg bg-ink-100 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-5 w-5 text-ink-500" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-900">{client.name}</h1>
            {client.industry && <p className="text-sm text-ink-500 mt-0.5">{client.industry}</p>}
            <p className="text-xs text-ink-400 mt-1">Client since {formatDate(client.createdAt)}</p>
          </div>
        </div>
        <Link
          href={`/contractor/projects/new?clientId=${client.id}`}
          className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'inline-flex items-center gap-1.5 flex-shrink-0')}
        >
          <Plus className="h-4 w-4" />
          New project
        </Link>
      </div>

      {(client.contactName || client.contactEmail || client.contactPhone) && (
        <div className="rounded-lg border border-ink-200 bg-white px-5 py-4 flex flex-wrap gap-5">
          {client.contactName && (
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-ink-400" strokeWidth={1.5} />
              <span className="text-sm text-ink-700">{client.contactName}</span>
            </div>
          )}
          {client.contactEmail && (
            <a href={`mailto:${client.contactEmail}`} className="flex items-center gap-2 hover:text-accent-600 transition-colors">
              <Mail className="h-3.5 w-3.5 text-ink-400" strokeWidth={1.5} />
              <span className="text-sm text-ink-700">{client.contactEmail}</span>
            </a>
          )}
          {client.contactPhone && (
            <a href={`tel:${client.contactPhone}`} className="flex items-center gap-2 hover:text-accent-600 transition-colors">
              <Phone className="h-3.5 w-3.5 text-ink-400" strokeWidth={1.5} />
              <span className="text-sm text-ink-700">{client.contactPhone}</span>
            </a>
          )}
        </div>
      )}

      {client.notes && (
        <div className="rounded-lg border border-ink-100 bg-ink-25 px-5 py-4">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-widest mb-1.5">Notes</p>
          <p className="text-sm text-ink-700 leading-relaxed">{client.notes}</p>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-ink-900">
            Projects
            <span className="ml-2 text-ink-400 font-normal">({client.projects.length})</span>
          </h2>
        </div>

        {client.projects.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No projects yet"
            description="Create the first project for this client."
            action={{ label: 'New project', href: `/contractor/projects/new?clientId=${client.id}` }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {client.projects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
