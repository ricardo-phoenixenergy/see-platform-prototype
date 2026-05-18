import { getTemplates } from '@/server/queries/admin'
import { toggleTemplateActive } from '@/server/actions/admin'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export default async function TemplatesPage() {
  const templates = await getTemplates()

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink-900">Milestone Templates</h2>
          <p className="text-sm text-ink-500">{templates.length} template{templates.length !== 1 ? 's' : ''} configured.</p>
        </div>
        <Link
          href="/admin/templates/new"
          className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          New template
        </Link>
      </div>

      <div className="space-y-3">
        {templates.map((t) => (
          <div key={t.id} className="rounded-lg border border-ink-200 bg-white px-5 py-4 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-ink-900">{t.name}</p>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-ink-100 text-ink-600">v{t.version}</span>
                <span className={cn(
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded-sm',
                  t.isActive ? 'bg-success-500/10 text-success-600' : 'bg-ink-100 text-ink-400'
                )}>
                  {t.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs text-ink-500">
                {t.technology.replace(/_/g, ' ')} · {t.items.length} milestone{t.items.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link href={`/admin/templates/${t.id}`} className="text-xs text-accent-600 hover:underline font-medium">Edit</Link>
              <form action={toggleTemplateActive}>
                <input type="hidden" name="id" value={t.id} />
                <button type="submit" className="text-xs text-ink-500 hover:text-ink-700 transition-colors">
                  {t.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </form>
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <p className="text-sm font-medium text-ink-900">No templates yet</p>
            <p className="text-xs text-ink-500 mt-1">Create the first milestone template to enable project initialisation.</p>
          </div>
        )}
      </div>
    </div>
  )
}
