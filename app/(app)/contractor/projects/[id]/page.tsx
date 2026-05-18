import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getProject } from '@/server/queries/projects'

type Props = {
  params: Promise<{ id: string }>
}

export default async function ProjectWorkspacePage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session) redirect('/login')

  const project = await getProject(id, session.user.companyId)
  if (!project) notFound()

  // Redirect to overview tab by default
  redirect(`/contractor/projects/${id}/overview`)
}
