import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getClients } from '@/server/queries/clients'
import { NewProjectWizard } from './new-project-wizard'

type Props = { searchParams: Promise<{ clientId?: string }> }

export default async function NewProjectPage({ searchParams }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const [clients, params] = await Promise.all([
    getClients(session.user.companyId),
    searchParams,
  ])

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink-900">New project</h1>
        <p className="text-sm text-ink-500 mt-1">Fill in the project details across the steps below.</p>
      </div>
      <NewProjectWizard
        clients={clients.map(c => ({
          id: c.id,
          name: c.name,
          industry: c.industry,
          contactName: c.contactName,
        }))}
        {...(params.clientId ? { defaultClientId: params.clientId } : {})}
      />
    </div>
  )
}
