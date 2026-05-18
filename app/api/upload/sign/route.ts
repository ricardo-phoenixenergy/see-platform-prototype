import { auth } from '@/lib/auth'
import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { uploadRules, isMimeTypeAllowed } from '@/lib/upload-rules'

const purposeValues = [
  'milestone_artefact', 'kyc_document', 'compliance_doc', 'job_deliverable',
  'company_logo', 'site_photo', 'message_attachment', 'proof_of_payment',
] as const

const signSchema = z.object({
  filename: z.string().min(1).max(255),
  size: z.number().int().positive(),
  mimeType: z.string().min(1),
  purpose: z.enum(purposeValues),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const body = await request.json() as unknown
  const parsed = signSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 })
  }

  const { filename, size, mimeType, purpose } = parsed.data
  const rules = uploadRules[purpose]

  if (size > rules.maxSizeMb * 1024 * 1024) {
    return NextResponse.json(
      { error: `File too large. Maximum size is ${rules.maxSizeMb}MB.` },
      { status: 400 }
    )
  }

  if (!isMimeTypeAllowed(mimeType, rules.allowedMimeTypes)) {
    return NextResponse.json({ error: 'File type not allowed for this purpose.' }, { status: 400 })
  }

  const sanitised = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const blobPath = `${purpose}/${session.user.companyId}/${Date.now()}-${sanitised}`

  const { url } = await put(blobPath, Buffer.alloc(0), {
    access: 'public',
    contentType: mimeType,
    addRandomSuffix: true,
  })

  return NextResponse.json({ uploadUrl: url, blobPath, expiresAt: new Date(Date.now() + 5 * 60 * 1000) })
}
