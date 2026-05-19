import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { isEnterpriseCompany, getClientProjects } from '@/server/queries/client'

export default async function ClientIndexPage() {
  const session = await auth()
  if (!session) redirect('/login')
  const companyId = session.user.companyId

  if (isEnterpriseCompany(companyId)) {
    redirect('/client/enterprise/operations')
  }

  const projects = await getClientProjects(companyId)
  if (projects.length === 1 && projects[0]) {
    redirect(`/client/plant/${projects[0].siteId}`)
  }
  redirect('/client/portfolio')
}
