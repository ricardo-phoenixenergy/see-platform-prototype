import { NewProjectWizard } from './new-project-wizard'

export default function NewProjectPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">New project</h1>
        <p className="text-sm text-ink-500 mt-1">The correct milestone template will be selected automatically based on your inputs.</p>
      </div>
      <NewProjectWizard />
    </div>
  )
}
