import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getCompanyProfile } from '@/server/queries/company'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CompanyForm } from './company-form'
import { CheckCircle, Clock, XCircle, AlertCircle, FileText, Download } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const KYC_STATUS_CONFIG = {
  APPROVED: { label: 'Verified', icon: CheckCircle, className: 'text-success-500', badgeVariant: 'success' as const },
  PENDING: { label: 'Under review', icon: Clock, className: 'text-ink-400', badgeVariant: 'outline' as const },
  REJECTED: { label: 'Action required', icon: XCircle, className: 'text-danger-500', badgeVariant: 'danger' as const },
  REQUEST_INFO: { label: 'Info requested', icon: AlertCircle, className: 'text-warning-500', badgeVariant: 'warning' as const },
}

export default async function CompanyPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const company = await getCompanyProfile(session.user.companyId)
  if (!company) redirect('/login')

  const latestKyc = company.kycSubmissions[0]
  const kycStatus = latestKyc?.status ?? 'PENDING'
  const kycConfig = KYC_STATUS_CONFIG[kycStatus] ?? KYC_STATUS_CONFIG.PENDING
  const KycIcon = kycConfig.icon

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Company profile</h1>
          <p className="text-sm text-ink-500 mt-1">{company.name}</p>
        </div>
        {/* Generate Company Profile — mocked PDF */}
        <Button variant="secondary" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Generate profile PDF
        </Button>
      </div>

      {/* KYC Status Banner */}
      <Card className={kycStatus === 'APPROVED' ? 'border-success-500/30 bg-emerald-50/30' : ''}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <KycIcon className={`h-5 w-5 flex-shrink-0 ${kycConfig.className}`} strokeWidth={1.5} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-ink-900">KYC verification — {kycConfig.label}</p>
                <Badge variant={kycConfig.badgeVariant}>{kycConfig.label}</Badge>
              </div>
              {kycStatus === 'APPROVED' && latestKyc?.reviewedAt && (
                <p className="text-xs text-ink-500 mt-0.5">
                  Verified on {formatDate(latestKyc.reviewedAt)} · CIPC, VAT, Director ID on file
                </p>
              )}
              {kycStatus === 'PENDING' && (
                <p className="text-xs text-ink-500 mt-0.5">
                  Your documents are being reviewed. This typically takes 1–2 business days.
                </p>
              )}
              {kycStatus === 'REJECTED' && latestKyc?.rejectionReason && (
                <p className="text-xs text-danger-500 mt-0.5">{latestKyc.rejectionReason}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company details form */}
      <Card>
        <CardHeader>
          <CardTitle>Company details</CardTitle>
        </CardHeader>
        <CardContent>
          <CompanyForm
            companyId={company.id}
            initialData={{
              name: company.name,
              about: company.about ?? '',
              phone: company.phone ?? '',
              email: company.email ?? '',
              websiteUrl: company.websiteUrl ?? '',
              registrationNo: company.registrationNo ?? '',
              vatNo: company.vatNo ?? '',
              beeeLevel: company.beeeLevel ?? null,
              logoUrl: company.logoUrl ?? null,
            }}
          />
        </CardContent>
      </Card>

      {/* Compliance documents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Compliance documents</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {company.complianceDocs.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <FileText className="mb-3 h-8 w-8 text-ink-300" strokeWidth={1.5} />
              <p className="text-sm font-medium text-ink-900">No documents uploaded</p>
              <p className="text-xs text-ink-500 mt-1">Upload BEEE certificates, tax clearance, and PI insurance.</p>
            </div>
          ) : (
            <ul className="divide-y divide-ink-100">
              {company.complianceDocs.map(doc => (
                <li key={doc.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-ink-900">{doc.category}</p>
                    {doc.expiresAt && (
                      <p className="text-xs text-ink-400 mt-0.5">Expires {formatDate(doc.expiresAt)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.isVerified && (
                      <Badge variant="success">Verified</Badge>
                    )}
                    <a
                      href={doc.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent-600 hover:text-accent-700"
                    >
                      View
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Bank details — masked */}
      {company.bankName && (
        <Card>
          <CardHeader>
            <CardTitle>Banking details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-ink-400 uppercase tracking-widest mb-1">Bank</p>
                <p className="text-ink-900">{company.bankName}</p>
              </div>
              {company.bankAccountLast4 && (
                <div>
                  <p className="text-xs text-ink-400 uppercase tracking-widest mb-1">Account</p>
                  <p className="text-ink-900 font-mono">&bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; {company.bankAccountLast4}</p>
                </div>
              )}
            </div>
            <p className="text-xs text-ink-400 mt-3">
              Contact support to update banking details. Changes require KYC re-verification.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
