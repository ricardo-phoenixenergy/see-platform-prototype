// app/api/upload/file/route.ts
// Server-side file upload to Vercel Blob.
// Replaces the broken sign+client-PUT pattern — browsers can't do cross-origin
// PUT to *.blob.vercel-storage.com. File is received here as multipart FormData
// and uploaded server-side where the BLOB_READ_WRITE_TOKEN is available.

import { auth } from '@/lib/auth'
import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { uploadRules, isMimeTypeAllowed } from '@/lib/upload-rules'
import type { UploadPurpose } from '@/lib/upload-rules'

const VALID_PURPOSES = new Set<UploadPurpose>([
  'milestone_artefact', 'kyc_document', 'compliance_doc', 'job_deliverable',
  'company_logo', 'site_photo', 'message_attachment', 'proof_of_payment',
])

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })
  }

  const file = formData.get('file')
  const purpose = formData.get('purpose')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  }
  if (typeof purpose !== 'string' || !VALID_PURPOSES.has(purpose as UploadPurpose)) {
    return NextResponse.json({ error: 'Invalid purpose' }, { status: 400 })
  }

  const rules = uploadRules[purpose as UploadPurpose]

  if (file.size > rules.maxSizeMb * 1024 * 1024) {
    return NextResponse.json(
      { error: `File too large. Maximum size is ${rules.maxSizeMb} MB.` },
      { status: 400 }
    )
  }

  if (!isMimeTypeAllowed(file.type, rules.allowedMimeTypes)) {
    return NextResponse.json({ error: 'File type not allowed for this purpose.' }, { status: 400 })
  }

  const sanitised = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const blobPath = `${purpose}/${session.user.companyId}/${Date.now()}-${sanitised}`

  const blob = await put(blobPath, file, {
    access: 'public',
    contentType: file.type,
    addRandomSuffix: true,
  })

  return NextResponse.json({ url: blob.url })
}
