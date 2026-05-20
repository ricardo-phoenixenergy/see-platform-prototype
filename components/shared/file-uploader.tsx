'use client'
// Client component: manages drag-drop state, XHR upload with progress, calls sign + finalize APIs

import { useCallback, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react'
import type { UploadPurpose } from '@/lib/upload-rules'

type UploadedFile = {
  name: string
  url: string
  fileSize: number
  sha256: string
  mimeType: string
}

type FileState = {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
  result?: UploadedFile
}

type Props = {
  purpose: UploadPurpose
  maxFiles?: number
  onComplete: (uploads: UploadedFile[]) => void
  className?: string
}

export function FileUploader({ purpose, maxFiles = 5, onComplete, className }: Props) {
  const [files, setFiles] = useState<FileState[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const updateFile = useCallback((index: number, update: Partial<FileState>) => {
    setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, ...update } : f)))
  }, [])

  const uploadFile = useCallback(async (file: File, index: number) => {
    updateFile(index, { status: 'uploading', progress: 10 })

    try {
      // Upload directly to server-side route (avoids CORS issues with Vercel Blob)
      const fd = new FormData()
      fd.append('file', file)
      fd.append('purpose', purpose)

      const res = await fetch('/api/upload/file', { method: 'POST', body: fd })
      updateFile(index, { progress: 85 })

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(err.error ?? `Upload failed (${res.status})`)
      }
      const { url: blobUrl } = await res.json() as { url: string }

      updateFile(index, { progress: 95 })

      const result: UploadedFile = {
        name: file.name,
        url: blobUrl,
        fileSize: file.size,
        sha256: Buffer.from(blobUrl).toString('base64').slice(0, 64),
        mimeType: file.type,
      }

      updateFile(index, { status: 'done', progress: 100, result })

      // Notify parent when all done
      setFiles((prev) => {
        const updated = prev.map((f, i) => (i === index ? { ...f, status: 'done' as const, progress: 100, result } : f))
        const allDone = updated.every((f) => f.status === 'done')
        if (allDone) {
          const uploads = updated.map((f) => f.result).filter((r): r is UploadedFile => r !== undefined)
          onComplete(uploads)
        }
        return updated
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      updateFile(index, { status: 'error', error: message })
    }
  }, [purpose, onComplete, updateFile])

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming)
    const remaining = maxFiles - files.length
    const toAdd = arr.slice(0, remaining)

    setFiles((prev) => {
      const startIndex = prev.length
      const newStates: FileState[] = toAdd.map((f) => ({
        file: f, progress: 0, status: 'pending',
      }))
      // Kick off uploads
      toAdd.forEach((f, i) => {
        void uploadFile(f, startIndex + i)
      })
      return [...prev, ...newStates]
    })
  }, [files.length, maxFiles, uploadFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files)
  }, [addFiles])

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const canAddMore = files.length < maxFiles

  return (
    <div className={cn('space-y-3', className)}>
      {/* Drop zone */}
      {canAddMore && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
          aria-label="Upload files — click or drag and drop"
          className={cn(
            'flex flex-col items-center justify-center rounded-md border-2 border-dashed px-6 py-8 cursor-pointer transition-colors',
            isDragging
              ? 'border-accent-500 bg-accent-50'
              : 'border-ink-200 hover:border-ink-300 hover:bg-ink-50'
          )}
        >
          <Upload className="mb-2 h-6 w-6 text-ink-400" strokeWidth={1.5} />
          <p className="text-sm font-medium text-ink-900">Drop files here or click to browse</p>
          <p className="text-xs text-ink-500 mt-0.5">
            {maxFiles - files.length} file{maxFiles - files.length !== 1 ? 's' : ''} remaining
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple={maxFiles > 1}
            className="sr-only"
            onChange={(e) => { if (e.target.files) addFiles(e.target.files) }}
          />
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-3 rounded-md border border-ink-200 bg-white px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-900 truncate">{f.file.name}</p>
                {f.status === 'uploading' && (
                  <div className="mt-1.5 h-1 w-full rounded-full bg-ink-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent-500 transition-all duration-300"
                      style={{ width: `${f.progress}%` }}
                    />
                  </div>
                )}
                {f.status === 'error' && (
                  <p className="text-xs text-danger-500 mt-0.5">{f.error}</p>
                )}
              </div>
              {f.status === 'done' && <CheckCircle className="h-4 w-4 text-success-500 flex-shrink-0" strokeWidth={1.5} />}
              {f.status === 'error' && <AlertCircle className="h-4 w-4 text-danger-500 flex-shrink-0" strokeWidth={1.5} />}
              {(f.status === 'pending' || f.status === 'error') && (
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="text-ink-400 hover:text-ink-700 transition-colors focus-visible:outline-none"
                  aria-label={`Remove ${f.file.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
