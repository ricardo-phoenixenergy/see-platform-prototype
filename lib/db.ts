// lib/db.ts
// Prisma client singleton — prevents hot-reload exhausting connection pool in dev.
//
// Prisma 7 requires a Driver Adapter (or Accelerate URL).
// We use @prisma/adapter-pg for a direct Postgres connection via DATABASE_URL.
// In production this is a Vercel Postgres connection string.
// During development without a DB, DATABASE_URL can be left unset and the client
// will only error when a query is actually executed (not at import time).

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL ?? ''
  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
