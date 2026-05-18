// types/next-auth.d.ts
// Extends the Auth.js v5 Session and JWT types with SEE Platform fields.
// These augmentations are merged via TypeScript declaration merging.

import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      role: string
      companyId: string
      memberships: { role: string; companyId: string; companyName: string }[]
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    companyId?: string
    memberships?: { role: string; companyId: string; companyName: string }[]
  }
}
