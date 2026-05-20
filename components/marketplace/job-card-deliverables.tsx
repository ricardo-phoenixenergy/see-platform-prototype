'use client'
// components/marketplace/job-card-deliverables.tsx

import { useState, useRef, useTransition } from 'react'
import { addDeliverable, deleteDeliverable } from '@/server/actions/marketplace'
import { uploadFile } from '@/lib/upload-file'
import { ExternalLink, Upload, Loader2, FileText, X, Trash2 } from 'lucide-react'

type Deliverable = { id: string; name: string; url: string; version: number; createdAt: string }
type Props = { jobCardId: string; deliverables: Deliverable[]; canUpload: boolean }

export function JobCardDeliverables({ jobCardId, deliverables, canUpload }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [localDeliverables, setLocalDeliverables] = useState(deliverables)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteDeliverable(id)
      setLocalDeliverables((prev) => prev.filter((d) => d.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete deliverable.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleUpload() {
    if (!selectedFile) return
    setError(null)
    setUploading(true)

    try {
      const url = await uploadFile(selectedFile, 'job_deliverable')

      startTransition(async () => {
        try {
          await addDeliverable({ jobCardId, name: selectedFile.name, url })
          setLocalDeliverables((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              name: selectedFile.name,
              url,
              version: prev.length + 1,
              createdAt: new Date().toISOString(),
            },
          ])
          setSelectedFile(null)
          if (inputRef.current) inputRef.current.value = ''
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Failed to save deliverable.')
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const isLoading = uploading || isPending

  return (
    <div className="space-y-3">
      {/* Existing deliverables */}
      {localDeliverables.map((d) => (
        <div key={d.id} className="flex items-center gap-2 group">
          <a
            href={d.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-accent-600 hover:underline flex-1 min-w-0"
          >
            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
            <span className="truncate">{d.name}</span>
            <span className="text-xs text-ink-400 flex-shrink-0">v{d.version}</span>
          </a>
          {canUpload && (
            <button
              type="button"
              onClick={() => handleDelete(d.id)}
              disabled={deletingId === d.id}
              className="opacity-0 group-hover:opacity-100 text-ink-300 hover:text-danger-500 transition-all flex-shrink-0"
              aria-label={`Delete ${d.name}`}
            >
              {deletingId === d.id
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.5} />
                : <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              }
            </button>
          )}
        </div>
      ))}

      {localDeliverables.length === 0 && (
        <p className="text-xs text-ink-400">No deliverables uploaded yet.</p>
      )}

      {/* Upload area */}
      {canUpload && (
        <div className="space-y-2 pt-2 border-t border-ink-100">
          <p className="text-xs font-medium text-ink-700">Upload deliverable</p>

          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) { setSelectedFile(f); setError(null) }
            }}
          />

          {!selectedFile ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-2 h-9 w-full rounded-md border-2 border-dashed border-ink-300 bg-white text-xs font-medium text-ink-600 hover:border-ink-400 hover:bg-ink-50 transition-colors justify-center"
            >
              <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
              Click to select file
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-md border border-ink-200 bg-white px-3 py-2">
              <FileText className="h-4 w-4 text-ink-400 flex-shrink-0" strokeWidth={1.5} />
              <span className="text-xs text-ink-700 flex-1 truncate">{selectedFile.name}</span>
              <button
                type="button"
                onClick={() => { setSelectedFile(null); if (inputRef.current) inputRef.current.value = '' }}
                className="text-ink-400 hover:text-ink-700 flex-shrink-0"
                aria-label="Remove file"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </div>
          )}

          {error && <p className="text-xs text-danger-600">{error}</p>}

          {selectedFile && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={isLoading}
              className="flex items-center justify-center gap-1.5 h-8 w-full rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors disabled:opacity-50"
            >
              {isLoading
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Uploading…</>
                : <><Upload className="h-3.5 w-3.5" strokeWidth={1.5} />Upload deliverable</>
              }
            </button>
          )}
        </div>
      )}
    </div>
  )
}
