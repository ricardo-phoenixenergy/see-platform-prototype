import { TemplateForm } from '@/components/admin/template-form'

export default function NewTemplatePage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink-900">New Template</h2>
        <p className="text-sm text-ink-500">Define the milestone sequence for a project type.</p>
      </div>
      <TemplateForm />
    </div>
  )
}
