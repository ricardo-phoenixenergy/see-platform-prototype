// middleware.ts
// Edge-compatible auth middleware for the SEE Platform.
// Protects all non-public routes and enforces role-based redirects.
// Auth.js v5 `auth()` used as middleware directly — runs on every matched request.

import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const PUBLIC_PATHS = new Set(['/', '/login', '/register', '/verify-email'])

export default auth((req) => {
  const { pathname } = req.nextUrl

  const isPublic =
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')

  if (!req.auth && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (req.auth) {
    const role = req.auth.user.role

    // Admin routes: only ADMIN role allowed
    if (pathname.startsWith('/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/contractor', req.url))
    }

    // Service-provider routes: only SERVICE_PROVIDER role allowed
    if (pathname.startsWith('/service-provider') && role !== 'SERVICE_PROVIDER') {
      return NextResponse.redirect(new URL('/contractor', req.url))
    }

    // Client routes: only CLIENT role allowed
    if (pathname.startsWith('/client') && role !== 'CLIENT') {
      return NextResponse.redirect(new URL('/contractor', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
