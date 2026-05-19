// app/api/client/om-events/route.ts

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getClientProjects, getOmEvents } from '@/server/queries/client'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projects = await getClientProjects(session.user.companyId)
  const operationalProject = projects.find((p) => p.stage === 'OPERATIONAL') ?? projects[0]

  if (!operationalProject) {
    return NextResponse.json({ events: [], projectId: '' })
  }

  const events = await getOmEvents(operationalProject.id)
  return NextResponse.json({ events, projectId: operationalProject.id })
}
