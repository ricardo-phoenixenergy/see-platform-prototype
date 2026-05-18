// lib/auth.ts
// Auth.js v5 configuration for the SEE Platform.
// Uses JWT sessions (no DB session table needed for the prototype).
// 'use server' is NOT needed here — this is a plain module imported by both
// server components and the middleware.

import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Cast our custom-output PrismaClient to `any` for the adapter.
  // The generated client at lib/generated/prisma is structurally compatible with the
  // standard @prisma/client PrismaClient; the paths just differ. @prisma/client in
  // this project doesn't re-export PrismaClient (no .prisma/client generated there),
  // so we cannot import the type — a runtime-safe `any` cast is the least-bad option.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(db as any),
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
          include: {
            memberships: { include: { company: true } },
          },
        })
        if (!user?.passwordHash) return null

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!valid) return null

        const primaryMembership = user.memberships[0]

        // exactOptionalPropertyTypes: all fields must be explicitly defined.
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
          role: primaryMembership?.role ?? ('CONTRACTOR' as const),
          companyId: primaryMembership?.companyId ?? '',
          memberships: user.memberships.map((m) => ({
            role: m.role as string,
            companyId: m.companyId,
            companyName: m.company.name,
          })),
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        // Bracket notation avoids the JWT index-signature issue under strict mode.
        token['role'] = (user as unknown as { role: string }).role
        token['companyId'] = (user as unknown as { companyId: string }).companyId
        token['memberships'] = (
          user as unknown as { memberships: unknown[] }
        ).memberships
      }
      return token
    },
    session({ session, token }) {
      session.user.role = token['role'] as string
      session.user.companyId = token['companyId'] as string
      session.user.memberships = token['memberships'] as {
        role: string
        companyId: string
        companyName: string
      }[]
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
})
