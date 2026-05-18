// app/api/auth/[...nextauth]/route.ts
// Auth.js v5 catch-all route handler for Next.js App Router.
// Handles all /api/auth/* requests (sign-in, sign-out, callback, session, csrf, etc.)

import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers
