'use client'
// Client component: milestone submission form with FileUploader

import { useState } from 'react'
import { FileUploader } from '@/components/shared/file-uploader'
import { Button } from '@/components/ui/button'
import { submitMilestone } from '@/server/actions/milestones'
import { useRouter } from 'next/navigation'

type UploadedFile = {
  name: string
  url: string
  fileSize: number
  sha256: string
  mimeType: string
}

type Props = {
  milestoneId: string
  projectId: string
}

export function SubmissionForm({ milestoneId, projectId }: Props) {
  const router = useRouter()
  const [uploads, setUploads] = useState<UploadedFile[]>([])
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (uploads.length === 0) {
      setError('Upload at least one document before submitting.')
      return
    }
    setSubmitting(true)
    setError(null)

    const result = await submitMilestone({
      milestoneId,
      projectId,
      notes: notes.trim() || undefined,
      artefacts: uploads,
    })

    setSubmitting(false)
    if (result.ok) {
      router.refresh()
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="space-y-4">
      <FileUploader
        purpose="milestone_artefact"
        maxFiles={5}
        onComplete={setUploads}
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink-900">
          Notes <span className="text-ink-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Any context for the reviewer — version notes, deviations, or explanations."
          className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-accent-500 focus:outline-none focus:shadow-ring resize-none"
        />
      </div>
      {error && <p className="text-sm text-danger-500">{error}</p>}
      <Button
        onClick={handleSubmit}
        loading={submitting}
        disabled={uploads.length === 0}
      >
        Submit for review
      </Button>
    </div>
  )
}
