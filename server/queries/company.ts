import { db } from '@/lib/db'

export async function getCompanyProfile(companyId: string) {
  return db.company.findUnique({
    where: { id: companyId },
    include: {
      kycSubmissions: { orderBy: { createdAt: 'desc' }, take: 1 },
      complianceDocs: { orderBy: { createdAt: 'desc' } },
      tierStatus: true,
    },
  })
}
