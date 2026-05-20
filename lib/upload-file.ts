// lib/upload-file.ts
// Single helper for all client-side file uploads.
// POSTs to /api/upload/file (server-side Vercel Blob) to avoid CORS issues.

import type { UploadPurpose } from './upload-rules'

export async function uploadFile(file: File, purpose: UploadPurpose): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('purpose', purpose)

  const res = await fetch('/api/upload/file', { method: 'POST', body: fd })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(err.error ?? `Upload failed (${res.status})`)
  }

  const { url } = await res.json() as { url: string }
  return url
}
