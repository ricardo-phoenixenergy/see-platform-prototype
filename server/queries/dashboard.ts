import { db } from '@/lib/db'

export async function getTierInfo(companyId: string) {
  const [tier, wallet] = await Promise.all([
    db.tierStatus.findUnique({ where: { companyId } }),
    db.walletBalance.findUnique({ where: { companyId } }),
  ])
  return {
    tier: (tier?.tier ?? 'BRONZE') as 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM',
    tokens: wallet?.tokens ?? 0,
  }
}
