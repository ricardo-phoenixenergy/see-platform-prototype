import { ClientForm } from './client-form'

export default function NewClientPage() {
  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink-900">New client</h1>
        <p className="text-sm text-ink-500 mt-1">
          Add a client record. You can attach multiple projects to them.
        </p>
      </div>
      <ClientForm />
    </div>
  )
}
