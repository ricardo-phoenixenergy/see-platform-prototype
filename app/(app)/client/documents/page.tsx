import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getClientProjects, getProjectDocuments } from '@/server/queries/client'
import { ExternalLink, FileText } from 'lucide-react'

export default async function DocumentsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const projects = await getClientProjects(session.user.companyId)
  const docsPerProject = await Promise.all(
    projects.map(async (p) => ({
      project: p,
      docs: await getProjectDocuments(p.id),
    }))
  )

  const totalDocs = docsPerProject.reduce((s, p) => s + p.docs.length, 0)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Documents</h2>
        <p className="text-sm text-ink-500">
          {totalDocs} document{totalDocs !== 1 ? 's' : ''} across {projects.length} project{projects.length !== 1 ? 's' : ''}.
        </p>
      </div>

      {docsPerProject.map(({ project, docs }) => (
        docs.length > 0 && (
          <div key={project.id} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-400">{project.name}</h3>
            {docs.map((doc) => (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 rounded-lg border border-ink-200 bg-white px-4 py-3 hover:border-ink-300 transition-colors"
              >
                <FileText className="h-4 w-4 text-ink-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">{doc.name}</p>
                  <p className="text-xs text-ink-500">{doc.category} · {Math.round(doc.fileSize / 1024)} KB</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-ink-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              </a>
            ))}
          </div>
        )
      ))}

      {totalDocs === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <FileText className="h-8 w-8 text-ink-300 mb-3" strokeWidth={1.5} />
          <p className="text-sm font-medium text-ink-900">No documents yet</p>
          <p className="text-xs text-ink-500 mt-1">
            Commissioning certificates, warranties, and reports will appear here.
          </p>
        </div>
      )}
    </div>
  )
}
