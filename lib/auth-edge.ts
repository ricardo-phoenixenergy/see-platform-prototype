// lib/auth-edge.ts
// Edge-compatible subset of Auth.js v5 configuration.
// This file is imported ONLY by middleware.ts (Edge runtime).
// It must NOT import Prisma, bcryptjs, or any Node.js-only module.
// JWT verification works on the Edge; credential authorize (DB lookup) does not.
//
// Why split: middleware.ts runs on the Vercel Edge runtime which does not support
// Node.js built-ins (node:crypto, node:fs, etc.) that Prisma requires. Splitting
// the config lets middleware verify JWTs on the edge while full auth (sign-in,
// adapter, bcrypt) runs only in Node.js route handlers and server components.

import NextAuth from 'next-auth'

export const { auth } = NextAuth({
  session: { strategy: 'jwt' },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
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
