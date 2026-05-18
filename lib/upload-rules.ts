export type UploadPurpose =
  | 'milestone_artefact'
  | 'kyc_document'
  | 'compliance_doc'
  | 'job_deliverable'
  | 'company_logo'
  | 'site_photo'
  | 'message_attachment'
  | 'proof_of_payment'

type UploadRule = {
  maxSizeMb: number
  allowedMimeTypes: string[]
}

export const uploadRules: Record<UploadPurpose, UploadRule> = {
  milestone_artefact: {
    maxSizeMb: 50,
    allowedMimeTypes: [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },
  kyc_document: {
    maxSizeMb: 10,
    allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg'],
  },
  compliance_doc: {
    maxSizeMb: 10,
    allowedMimeTypes: ['application/pdf'],
  },
  job_deliverable: {
    maxSizeMb: 100,
    allowedMimeTypes: ['*'],
  },
  company_logo: {
    maxSizeMb: 2,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml'],
  },
  site_photo: {
    maxSizeMb: 10,
    allowedMimeTypes: ['image/png', 'image/jpeg'],
  },
  message_attachment: {
    maxSizeMb: 25,
    allowedMimeTypes: ['*'],
  },
  proof_of_payment: {
    maxSizeMb: 5,
    allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg'],
  },
}

export function isMimeTypeAllowed(mimeType: string, allowedTypes: string[]): boolean {
  if (allowedTypes.includes('*')) return true
  return allowedTypes.includes(mimeType)
}
