import { notFound } from 'next/navigation'
import { getTemplate } from '@/server/queries/admin'
import { TemplateForm } from '@/components/admin/template-form'

type Props = { params: Promise<{ id: string }> }

export default async function TemplateEditorPage({ params }: Props) {
  const { id } = await params
  const template = await getTemplate(id)
  if (!template) notFound()

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Edit Template</h2>
        <p className="text-sm text-ink-500">{template.name} · v{template.version}</p>
      </div>
      <TemplateForm
        defaultValues={{
          name: template.name,
          technology: template.technology,
          minSizeKw: template.minSizeKw?.toString() ?? '',
          maxSizeKw: template.maxSizeKw?.toString() ?? '',
          items: template.items.map((item) => ({
            order: item.order,
            name: item.name,
            description: item.description,
            phase: item.phase,
            isHardGate: item.isHardGate,
            estimatedDays: item.estimatedDays?.toString() ?? '',
          })),
        }}
      />
    </div>
  )
}
