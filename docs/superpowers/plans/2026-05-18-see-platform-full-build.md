# SEE Platform — Full Build Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully demo-ready, high-fidelity interactive prototype of the SEE Platform — a B2B operating system for renewable energy project development in Southern Africa — across 6 phased milestones with review gates between each phase.

**Architecture:** Next.js 15 App Router with Server Components by default; Prisma + Vercel Postgres for data; Auth.js v5 for role-based sessions; TanStack Query for client-side fetching; Zustand for cross-cutting UI state only; Server Actions for mutations; parallel subagent execution for independent milestone workstreams in Phases 3–5.

**Tech Stack:** Next.js 15, React 19, TypeScript 5 strict, Tailwind CSS 4, Radix UI primitives, CVA, tailwind-merge, Prisma 5, Vercel Postgres, Vercel Blob, Auth.js v5, TanStack Query v5, React Hook Form + Zod, Anthropic Claude SDK (`claude-sonnet-4-20250514`), Recharts, Framer Motion, Lucide React, date-fns, react-pdf, Resend, Sonner

**Before every UI milestone:** Invoke `frontend-design` skill.
**Before any library usage:** Invoke `context7` to fetch current docs.
**Before any complex logic design:** Invoke `sequential-thinking`.
**Before parallel workstreams:** Invoke `dispatching-parallel-agents`.
**Before declaring any phase complete:** Invoke `superpowers:verification-before-completion`.

---

## File Structure

```
see-platform-prototype/
├── app/
│   ├── (marketing)/
│   │   └── page.tsx                    # Landing page
│   ├── (auth)/
│   │   ├── layout.tsx                  # Auth shell (centred, wordmark)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── verify-email/page.tsx
│   ├── (app)/
│   │   ├── contractor/
│   │   │   ├── layout.tsx              # Sidebar + topbar for contractor
│   │   │   ├── page.tsx                # Contractor dashboard
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx            # Projects grid
│   │   │   │   ├── new/page.tsx        # New project wizard
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx        # Project workspace shell
│   │   │   │       ├── overview/page.tsx
│   │   │   │       ├── milestones/page.tsx
│   │   │   │       ├── milestones/[milestoneId]/page.tsx
│   │   │   │       └── monitoring/page.tsx
│   │   │   ├── marketplace/page.tsx
│   │   │   ├── service-center/page.tsx
│   │   │   ├── wallet/page.tsx
│   │   │   └── company/page.tsx
│   │   ├── service-provider/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                # SP dashboard (opportunity board)
│   │   │   └── jobs/[id]/page.tsx      # Job card detail
│   │   ├── client/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                # Client portfolio
│   │   │   └── sites/[id]/page.tsx     # Plant dashboard
│   │   └── admin/
│   │       ├── layout.tsx
│   │       ├── page.tsx                # Admin dashboard
│   │       ├── kyc/page.tsx
│   │       ├── milestones/page.tsx     # Submission review queue
│   │       ├── users/page.tsx
│   │       ├── templates/page.tsx
│   │       └── enterprise/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── upload/
│   │   │   ├── sign/route.ts
│   │   │   └── finalize/route.ts
│   │   ├── ai/
│   │   │   ├── chat/route.ts           # SEE.AI streaming
│   │   │   └── verify/route.ts         # Stubbed AI verification
│   │   ├── projects/route.ts
│   │   ├── milestones/[id]/submit/route.ts
│   │   ├── rfq/route.ts
│   │   ├── marketplace/hardware/route.ts
│   │   ├── payments/route.ts
│   │   └── messages/route.ts           # Comms polling
│   ├── layout.tsx                      # Root layout (fonts, providers)
│   └── globals.css
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── select.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── tabs.tsx
│   │   ├── badge.tsx
│   │   ├── card.tsx
│   │   ├── table.tsx
│   │   ├── skeleton.tsx
│   │   ├── toast.tsx                   # Sonner wrapper
│   │   └── empty-state.tsx
│   ├── brand/
│   │   ├── wordmark.tsx
│   │   └── tier-badge.tsx
│   ├── shell/
│   │   ├── sidebar.tsx
│   │   ├── topbar.tsx
│   │   └── role-switcher.tsx
│   ├── dashboard/
│   │   ├── stats-row.tsx
│   │   ├── newsfeed-sidebar.tsx
│   │   ├── milestone-watch.tsx
│   │   └── ai-suggestions.tsx
│   ├── project/
│   │   ├── project-card.tsx
│   │   ├── project-grid.tsx
│   │   ├── new-project-wizard.tsx
│   │   └── project-workspace.tsx
│   ├── milestone/
│   │   ├── milestone-tracker.tsx
│   │   ├── milestone-item.tsx
│   │   ├── submission-form.tsx
│   │   └── verification-animation.tsx
│   ├── comms/
│   │   ├── channel-sidebar.tsx
│   │   ├── message-timeline.tsx
│   │   ├── message-composer.tsx
│   │   └── thread-drawer.tsx
│   ├── marketplace/
│   │   ├── sp-directory.tsx
│   │   ├── rfq-form.tsx
│   │   ├── job-card-kanban.tsx
│   │   ├── hardware-grid.tsx
│   │   └── cart.tsx
│   ├── om/
│   │   ├── plant-dashboard.tsx
│   │   ├── production-chart.tsx
│   │   └── om-schedule.tsx
│   ├── payments/
│   │   ├── eft-modal.tsx
│   │   ├── invoice-view.tsx
│   │   └── license-activation.tsx
│   ├── ai/
│   │   ├── chat-widget.tsx
│   │   └── chat-message.tsx
│   └── shared/
│       ├── file-uploader.tsx
│       ├── data-table.tsx
│       ├── pdf-viewer.tsx
│       └── page-header.tsx
├── lib/
│   ├── auth.ts                         # Auth.js config
│   ├── db.ts                           # Prisma singleton
│   ├── anthropic.ts                    # Anthropic SDK client
│   ├── upload-rules.ts                 # Per-purpose file validation
│   ├── milestone-templates.ts          # Logic Engine: template selection
│   ├── tier-rules.ts                   # Tier progression thresholds
│   ├── tokens.ts                       # Token earning/spending
│   ├── permissions.ts                  # Role-based access helpers
│   ├── payments/
│   │   ├── rail.ts                     # EFT vs PayFast selection
│   │   ├── invoice.ts                  # Invoice generation helpers
│   │   └── commission.ts               # Reseller commission calc
│   ├── ai-tools.ts                     # SEE.AI tool definitions
│   └── utils.ts                        # cn(), formatters, constants
├── server/
│   ├── actions/
│   │   ├── projects.ts
│   │   ├── milestones.ts
│   │   ├── kyc.ts
│   │   ├── rfq.ts
│   │   ├── payments.ts
│   │   └── licensing.ts
│   └── queries/
│       ├── projects.ts
│       ├── milestones.ts
│       ├── dashboard.ts
│       ├── marketplace.ts
│       └── admin.ts
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── seed-empty.ts
├── types/
│   ├── next-auth.d.ts                  # Session type augmentation
│   └── api.ts                          # Zod schemas + inferred types
├── tests/
│   ├── unit/
│   │   ├── milestone-templates.test.ts
│   │   ├── tier-rules.test.ts
│   │   ├── tokens.test.ts
│   │   └── payment-rail.test.ts
│   └── e2e/
│       └── demo-dry-run.spec.ts        # Phase 6 only
├── public/
│   ├── fonts/                          # Self-hosted IBM Plex Sans woff2
│   ├── brand/wordmark.svg
│   └── seed-assets/                    # Demo PDFs for seed
├── middleware.ts                        # Role-based route protection
├── .env.example
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## ═══════════════════════════════════════
## PHASE 1 — Shell, Data & Auth
## M0 → M1 → M2 (sequential)
## ═══════════════════════════════════════

> **REVIEW GATE:** Login as all 4 demo users (one-click). Branded shell renders. 4 role dashboards reachable. File upload works end-to-end.

---

### Task 1.1: Initialise Git and Next.js 15 Project

**Files:**
- Create: `package.json`, `next.config.mjs`, `tsconfig.json`, `.gitignore`, `.env.example`

- [ ] **Initialise git repo**

```bash
cd "C:/Users/ricar/OneDrive/Desktop/Phoenix Energy/SEE Prototype/see-platform-prototype"
git init
```

- [ ] **Scaffold Next.js 15 with TypeScript**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=no --import-alias="@/*" --no-turbopack
```

When prompted: use App Router = yes, src/ directory = no, import alias = `@/*`.

- [ ] **Replace `tsconfig.json` with strict config**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Replace `next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
}
export default nextConfig
```

- [ ] **Create `.env.example`**

```
# Database
DATABASE_URL=
DIRECT_URL=

# Auth
AUTH_SECRET=
AUTH_URL=http://localhost:3000

# OAuth (optional — env-gated)
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_MICROSOFT_ID=
AUTH_MICROSOFT_SECRET=
AUTH_MICROSOFT_TENANT_ID=

# AI
ANTHROPIC_API_KEY=

# File storage
BLOB_READ_WRITE_TOKEN=

# Email
RESEND_API_KEY=
RESEND_FROM_EMAIL=demo@see.platform

# Feature flags
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_ENABLE_VOICE=false
```

- [ ] **Create `.env.local`** (copy from `.env.example`, fill in real values for local dev — never commit this file)

- [ ] **Add `.env.local` to `.gitignore`** (verify it's already there from create-next-app)

- [ ] **Install all dependencies**

```bash
npm install @prisma/client prisma @auth/prisma-adapter next-auth@beta \
  @tanstack/react-query @tanstack/react-query-devtools \
  react-hook-form @hookform/resolvers zod \
  @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs \
  @radix-ui/react-select @radix-ui/react-tooltip @radix-ui/react-popover \
  @radix-ui/react-checkbox @radix-ui/react-avatar @radix-ui/react-separator \
  class-variance-authority tailwind-merge clsx \
  framer-motion lucide-react date-fns \
  recharts react-pdf @anthropic-ai/sdk \
  resend sonner \
  @vercel/blob
npm install -D @types/node vitest @vitejs/plugin-react \
  @playwright/test prettier eslint-config-prettier \
  husky lint-staged tailwindcss-animate
```

- [ ] **Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 project with full dependency set"
```

---

### Task 1.2: Brand Tokens — Tailwind Config and CSS Variables

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`

- [ ] **Replace `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          25: 'hsl(var(--ink-25) / <alpha-value>)',
          50: 'hsl(var(--ink-50) / <alpha-value>)',
          100: 'hsl(var(--ink-100) / <alpha-value>)',
          200: 'hsl(var(--ink-200) / <alpha-value>)',
          300: 'hsl(var(--ink-300) / <alpha-value>)',
          400: 'hsl(var(--ink-400) / <alpha-value>)',
          500: 'hsl(var(--ink-500) / <alpha-value>)',
          600: 'hsl(var(--ink-600) / <alpha-value>)',
          700: 'hsl(var(--ink-700) / <alpha-value>)',
          800: 'hsl(var(--ink-800) / <alpha-value>)',
          900: 'hsl(var(--ink-900) / <alpha-value>)',
          950: 'hsl(var(--ink-950) / <alpha-value>)',
        },
        accent: {
          50: 'hsl(var(--accent-50) / <alpha-value>)',
          100: 'hsl(var(--accent-100) / <alpha-value>)',
          200: 'hsl(var(--accent-200) / <alpha-value>)',
          300: 'hsl(var(--accent-300) / <alpha-value>)',
          400: 'hsl(var(--accent-400) / <alpha-value>)',
          500: 'hsl(var(--accent-500) / <alpha-value>)',
          600: 'hsl(var(--accent-600) / <alpha-value>)',
          700: 'hsl(var(--accent-700) / <alpha-value>)',
          800: 'hsl(var(--accent-800) / <alpha-value>)',
          900: 'hsl(var(--accent-900) / <alpha-value>)',
        },
        tier: {
          bronze: '#A56A3E',
          silver: '#8B95A0',
          gold: '#C9A03E',
          platinum: '#6E7A8A',
        },
        success: { 500: '#1E9D6B' },
        warning: { 500: '#C9892B' },
        danger: { 500: '#C9384A' },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xs: '4px', sm: '6px', md: '8px', lg: '12px', xl: '16px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(10 11 13 / 0.04)',
        sm: '0 1px 3px 0 rgb(10 11 13 / 0.06), 0 1px 2px 0 rgb(10 11 13 / 0.04)',
        md: '0 4px 8px -2px rgb(10 11 13 / 0.06), 0 2px 4px -2px rgb(10 11 13 / 0.04)',
        lg: '0 12px 24px -4px rgb(10 11 13 / 0.08), 0 4px 8px -2px rgb(10 11 13 / 0.04)',
        xl: '0 24px 48px -8px rgb(10 11 13 / 0.10)',
        ring: '0 0 0 3px rgb(62 91 234 / 0.22)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config
```

- [ ] **Replace `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Neutrals — HSL values for Tailwind alpha support */
    --ink-25:  220 14% 98%;
    --ink-50:  220 13% 96%;
    --ink-100: 220 12% 93%;
    --ink-200: 220 11% 87%;
    --ink-300: 220 10% 79%;
    --ink-400: 220 9%  66%;
    --ink-500: 220 9%  55%;
    --ink-600: 220 9%  44%;
    --ink-700: 220 10% 33%;
    --ink-800: 220 11% 22%;
    --ink-900: 220 12% 14%;
    --ink-950: 220 13% 7%;

    /* Accent — deep electric blue */
    --accent-50:  231 100% 97%;
    --accent-100: 231 100% 93%;
    --accent-200: 231 100% 85%;
    --accent-300: 231 95%  76%;
    --accent-400: 231 88%  66%;
    --accent-500: 231 79%  57%;
    --accent-600: 231 75%  48%;
    --accent-700: 231 70%  37%;
    --accent-800: 231 68%  29%;
    --accent-900: 231 65%  22%;
  }

  * { border-color: hsl(var(--ink-200)); }
  body {
    background: hsl(var(--ink-25));
    color: hsl(var(--ink-900));
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```

- [ ] **Commit**

```bash
git add tailwind.config.ts app/globals.css
git commit -m "feat(m0): add brand tokens to Tailwind config and CSS"
```

---

### Task 1.3: IBM Plex Sans Font Setup

**Files:**
- Create: `public/fonts/` (woff2 files)
- Modify: `app/layout.tsx`

- [ ] **Download IBM Plex Sans woff2 files**

Download from the npm package `@fontsource/ibm-plex-sans` and copy to `public/fonts/`:

```bash
npm install @fontsource/ibm-plex-sans
# Copy the woff2 files to public/fonts/
node -e "
const fs = require('fs');
const src = 'node_modules/@fontsource/ibm-plex-sans/files/';
const dst = 'public/fonts/';
fs.mkdirSync(dst, { recursive: true });
['ibm-plex-sans-latin-400-normal','ibm-plex-sans-latin-500-normal','ibm-plex-sans-latin-600-normal','ibm-plex-sans-latin-700-normal'].forEach(f => {
  if (fs.existsSync(src + f + '.woff2')) fs.copyFileSync(src + f + '.woff2', dst + f + '.woff2');
});
console.log('Fonts copied');
"
npm uninstall @fontsource/ibm-plex-sans
```

- [ ] **Create `app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const plexSans = localFont({
  src: [
    { path: '../public/fonts/ibm-plex-sans-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/ibm-plex-sans-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/ibm-plex-sans-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/ibm-plex-sans-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SEE Platform',
  description: 'The operating system for energy project developers.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plexSans.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Commit**

```bash
git add public/fonts/ app/layout.tsx
git commit -m "feat(m0): add self-hosted IBM Plex Sans font"
```

---

### Task 1.4: Core UI Primitives

**Files:**
- Create: `lib/utils.ts`
- Create: `components/ui/button.tsx`
- Create: `components/ui/input.tsx`
- Create: `components/ui/card.tsx`
- Create: `components/ui/badge.tsx`
- Create: `components/ui/skeleton.tsx`
- Create: `components/ui/empty-state.tsx`

- [ ] **Create `lib/utils.ts`**

```ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(cents: number, currency = 'ZAR'): string {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency }).format(cents / 100)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date))
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}
```

- [ ] **Create `components/ui/button.tsx`**

```tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:shadow-ring rounded-md',
  {
    variants: {
      variant: {
        primary: 'bg-ink-900 text-white hover:bg-ink-800',
        secondary: 'bg-white text-ink-900 border border-ink-200 hover:bg-ink-50',
        accent: 'bg-accent-500 text-white hover:bg-accent-600',
        ghost: 'text-ink-700 hover:bg-ink-50 hover:text-ink-900',
        link: 'text-accent-600 hover:text-accent-700 underline-offset-4 hover:underline rounded-none',
        danger: 'bg-danger-500 text-white hover:bg-red-600',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean
  }

const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
)
Button.displayName = 'Button'
export { Button, buttonVariants }
```

- [ ] **Create `components/ui/input.tsx`**

```tsx
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, Props>(
  ({ className, label, hint, error, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink-900">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-10 w-full rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 placeholder:text-ink-400',
            'focus:border-accent-500 focus:outline-none focus:shadow-ring',
            'disabled:bg-ink-50 disabled:text-ink-500',
            error && 'border-danger-500',
            className
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-ink-500">{hint}</p>}
        {error && <p className="text-xs text-danger-500">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
export { Input }
```

- [ ] **Create `components/ui/card.tsx`**

```tsx
import { cn } from '@/lib/utils'

type Props = React.HTMLAttributes<HTMLDivElement>

function Card({ className, ...props }: Props) {
  return (
    <div
      className={cn('rounded-md border border-ink-200 bg-white shadow-xs', className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: Props) {
  return <div className={cn('flex flex-col gap-1 p-6', className)} {...props} />
}

function CardTitle({ className, ...props }: Props) {
  return <h3 className={cn('text-base font-semibold text-ink-900 tracking-snug', className)} {...props} />
}

function CardContent({ className, ...props }: Props) {
  return <div className={cn('px-6 pb-6', className)} {...props} />
}

export { Card, CardHeader, CardTitle, CardContent }
```

- [ ] **Create `components/ui/skeleton.tsx`**

```tsx
import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-ink-100', className)}
      {...props}
    />
  )
}
export { Skeleton }
```

- [ ] **Create `components/ui/empty-state.tsx`**

```tsx
import { type LucideIcon } from 'lucide-react'
import { Button } from './button'

type Props = {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="mb-3 h-8 w-8 text-ink-400" strokeWidth={1.5} />
      <p className="mb-1 text-base font-semibold text-ink-900">{title}</p>
      <p className="mb-4 max-w-xs text-sm text-ink-600">{description}</p>
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add components/ui/ lib/utils.ts
git commit -m "feat(m0): add core UI primitives (button, input, card, skeleton, empty-state)"
```

---

### Task 1.5: Brand Wordmark + Landing Page

**Files:**
- Create: `public/brand/wordmark.svg`
- Create: `components/brand/wordmark.tsx`
- Create: `app/(marketing)/page.tsx`
- Create: `app/(marketing)/layout.tsx`

- [ ] **Create `public/brand/wordmark.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 24" fill="none">
  <text x="0" y="19" font-family="IBM Plex Sans, system-ui, sans-serif"
        font-weight="600" font-size="22" letter-spacing="-0.04em" fill="currentColor">SEE</text>
</svg>
```

- [ ] **Create `components/brand/wordmark.tsx`**

```tsx
import { cn } from '@/lib/utils'

type Props = { className?: string; size?: 'sm' | 'md' | 'lg' }

export function Wordmark({ className, size = 'md' }: Props) {
  const sizes = { sm: 'text-lg', md: 'text-xl', lg: 'text-3xl' }
  return (
    <span
      className={cn(
        'font-bold tracking-[-0.04em] text-ink-900 select-none',
        sizes[size],
        className
      )}
    >
      SEE
    </span>
  )
}
```

- [ ] **Create `app/(marketing)/layout.tsx`**

```tsx
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Create `app/(marketing)/page.tsx`**

```tsx
import Link from 'next/link'
import { Wordmark } from '@/components/brand/wordmark'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ink-25 flex flex-col">
      <header className="px-8 pt-8">
        <Wordmark size="md" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Subtle lattice background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, #14161A 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative max-w-2xl">
          <p className="mb-2 text-xs font-medium tracking-widest uppercase text-ink-500">
            SEE Platform
          </p>
          <h1 className="mb-6 text-4xl font-semibold tracking-tight text-ink-900 leading-[1.2]">
            The operating system for<br />energy project developers.
          </h1>
          <p className="mb-8 text-base text-ink-600 max-w-md mx-auto leading-relaxed">
            From development to operations — one platform for every milestone, verification, and stakeholder in a renewable energy project.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/login">Request access</Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="px-8 py-6 text-xs text-ink-400">
        © 2026 SEE Platform. A joint venture between MW-GS Pty Ltd and Phoenix Energy Solutions.
      </footer>
    </div>
  )
}
```

- [ ] **Verify the landing page renders**

```bash
npm run dev
```
Open http://localhost:3000 — expect: off-white background, "SEE" wordmark top-left, heading "The operating system for energy project developers.", two buttons, no green/orange/yellow anywhere, IBM Plex Sans rendering.

- [ ] **Commit**

```bash
git add public/brand/ components/brand/wordmark.tsx app/(marketing)/
git commit -m "feat(m0): landing page with SEE wordmark and brand tokens"
```

---

### Task 1.6: ESLint, Prettier, Husky, CI

**Files:**
- Create: `.prettierrc`
- Modify: `.eslintrc.json`
- Create: `.husky/pre-commit`
- Create: `.github/workflows/ci.yml`
- Modify: `package.json` (scripts)

- [ ] **Create `.prettierrc`**

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

- [ ] **Update `package.json` scripts section**

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit",
  "format": "prettier --write .",
  "test:unit": "vitest run",
  "test:unit:watch": "vitest",
  "test:e2e": "playwright test",
  "db:push": "prisma db push",
  "db:migrate": "prisma migrate dev",
  "db:seed:demo": "prisma db seed",
  "db:seed:empty": "ts-node --project tsconfig.json prisma/seed-empty.ts",
  "db:reset": "prisma migrate reset --force && npm run db:seed:demo",
  "db:studio": "prisma studio",
  "prepare": "husky"
}
```

- [ ] **Configure Vitest — create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: { '@': resolve(__dirname, '.') },
  },
})
```

- [ ] **Initialise Husky**

```bash
npx husky init
```

- [ ] **Replace `.husky/pre-commit`**

```bash
npm run lint && npm run typecheck
```

- [ ] **Create `.github/workflows/ci.yml`**

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:unit
      - run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DIRECT_URL: ${{ secrets.DIRECT_URL }}
          AUTH_SECRET: ${{ secrets.AUTH_SECRET }}
          BLOB_READ_WRITE_TOKEN: ${{ secrets.BLOB_READ_WRITE_TOKEN }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

- [ ] **Commit**

```bash
git add .prettierrc .eslintrc.json .husky/ .github/ vitest.config.ts package.json
git commit -m "chore(m0): add Prettier, Husky pre-commit, GitHub Actions CI"
```

---

### Task 1.7: Prisma Setup + Full Schema

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/db.ts`

- [ ] **Initialise Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

- [ ] **Create `lib/db.ts`**

```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

- [ ] **Replace `prisma/schema.prisma`** with the complete schema from `docs/plan/03_DATA_MODEL.md` plus the additions from `docs/plan/08_COMMUNICATIONS.md` §"Schema additions" and `docs/plan/09_PAYMENTS_AND_LICENSING.md` §"Schema additions"

The full schema must include all models: User, Account, Session, VerificationToken, Company, Membership, KycSubmission, ComplianceDocument, TierStatus, WalletBalance, TokenTransaction, Project, Site, ProjectDocument, MilestoneTemplate, MilestoneTemplateItem, Milestone, MilestoneSubmission, MilestoneVerification, ServiceProviderProfile, Rfq, Bid, JobCard, JobDeliverable, JobMessage, Review, HardwareListing, Order, OrderItem, OmReading, OmEvent, ProjectSaleListing, NewsItem, AiConversation, AiMessage, Notification, AuditLog — plus the comms models (ProjectWorkspace, Channel, ChannelMembership, Message, MessageReaction) and payments/licensing models (Invoice, InvoiceLineItem, Payment, PlatformBankAccount, OmLicense, LicenseOffer, LicenseCommission, EnterpriseLicense, EnterpriseProjectScope, EnterpriseIntegration, EnterpriseSeat, EnterpriseUsageRecord).

Note: `OmContract` does NOT appear — it was replaced by `OmLicense`.

- [ ] **Run initial migration**

```bash
npx prisma migrate dev --name init
```

Expected: migration applied, Prisma client generated.

- [ ] **Commit**

```bash
git add prisma/ lib/db.ts
git commit -m "feat(m1): full Prisma schema and initial migration"
```

---

### Task 1.8: Seed Data

**Files:**
- Create: `prisma/seed.ts`
- Create: `prisma/seed-empty.ts`
- Create: `public/seed-assets/` (placeholder PDFs)

- [ ] **Add prisma seed config to `package.json`**

```json
"prisma": {
  "seed": "ts-node --project tsconfig.json prisma/seed.ts"
}
```

- [ ] **Create `prisma/seed.ts`** implementing the full demo dataset from `docs/plan/05_SEED_DATA.md`:

Key entities to create:
- **Users:** Marcus Adebayo (contractor), Lerato Mokoena (SP + contractor), Sipho Dlamini (client), Erin Berman-Levy (admin) — all with hashed passwords `demo1234`
- **Companies:** Adebayo Renewables (Silver tier, 12,400 tokens), Mokoena Engineering (SP), Spaza Holdings (Enterprise client), Durbanville Mall Properties (standard client), Kruger Family Farm (standard client)
- **Projects:** 12–15 projects across stages — Project Alpha (Spaza Soweto, Construction, mixed milestone states), Durbanville Mall (PPA, Design), Kruger Family Farm (Operational, AI license), Boksburg Spaza (#3, Construction), Manchester Restaurant Group (Operational, self-licensed EPC)
- **Milestone templates:** Solar C&I <1MW Outright, Solar C&I <1MW PPA, Solar C&I 1-5MW, Wind Utility, Hybrid
- **Milestones:** For Project Alpha — seeded with deliberate mixed states: some APPROVED, some AUTO_GOLD, one UNDER_REVIEW, one with open RFQ. The rejected-then-approved EIA story preserved.
- **Service providers:** 8 providers across 5 categories with ratings, response times
- **Hardware listings:** 30+ listings (panels, batteries, inverters, generators, accessories) with realistic specs and pricing
- **O&M readings:** 90 days of hourly readings for Kruger Family Farm and Durbanville Mall sites
- **News items:** 15 curated SA renewable energy headlines (REIPPPP updates, Eskom, grid stability)
- **AI conversations:** Seed one conversation for Marcus with 3 exchanges showing contextual responses
- **Comms:** Project Alpha workspace with 4 channels and ~80 messages including the rejected-EIA conversation thread

```ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('Seeding demo data...')

  const passwordHash = await bcrypt.hash('demo1234', 12)

  // Create users
  const marcus = await db.user.upsert({
    where: { email: 'marcus@adebayorenewables.co.za' },
    update: {},
    create: {
      email: 'marcus@adebayorenewables.co.za',
      name: 'Marcus Adebayo',
      emailVerified: new Date(),
      passwordHash,
    },
  })
  // ... (complete all users, companies, projects, milestones, etc. per 05_SEED_DATA.md)
  
  console.log('Seed complete.')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
```

- [ ] **Run seed to verify**

```bash
npm run db:seed:demo
```

Expected: "Seed complete." with no errors. Verify in Prisma Studio:

```bash
npm run db:studio
```

Check: 4 users exist, companies have correct tiers, Project Alpha has milestones with mixed states.

- [ ] **Commit**

```bash
git add prisma/seed.ts prisma/seed-empty.ts public/seed-assets/
git commit -m "feat(m1): demo seed data — 4 users, 12 projects, marketplace listings, O&M data"
```

---

### Task 1.9: Auth.js v5 Configuration

**Files:**
- Create: `lib/auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `types/next-auth.d.ts`
- Create: `middleware.ts`

- [ ] **Install bcryptjs**

```bash
npm install bcryptjs @types/bcryptjs
```

- [ ] **Create `lib/auth.ts`**

```ts
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
  adapter: PrismaAdapter(db),
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
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: primaryMembership?.role ?? 'CONTRACTOR',
          companyId: primaryMembership?.companyId ?? '',
          memberships: user.memberships.map(m => ({
            role: m.role,
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
        token.role = (user as { role: string }).role
        token.companyId = (user as { companyId: string }).companyId
        token.memberships = (user as { memberships: unknown[] }).memberships
      }
      return token
    },
    session({ session, token }) {
      session.user.role = token.role as string
      session.user.companyId = token.companyId as string
      session.user.memberships = token.memberships as {
        role: string; companyId: string; companyName: string
      }[]
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
})
```

- [ ] **Create `types/next-auth.d.ts`**

```ts
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
```

- [ ] **Create `app/api/auth/[...nextauth]/route.ts`**

```ts
import { handlers } from '@/lib/auth'
export const { GET, POST } = handlers
```

- [ ] **Create `middleware.ts`**

```ts
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const publicPaths = ['/', '/login', '/register', '/verify-email']

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith('/api/auth'))
  
  if (!req.auth && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (req.auth) {
    const role = req.auth.user.role
    if (pathname.startsWith('/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL(`/${role.toLowerCase().replace('_', '-')}`, req.url))
    }
    if (pathname.startsWith('/service-provider') && role !== 'SERVICE_PROVIDER') {
      return NextResponse.redirect(new URL('/contractor', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}
```

- [ ] **Commit**

```bash
git add lib/auth.ts app/api/auth/ types/next-auth.d.ts middleware.ts
git commit -m "feat(m2): Auth.js v5 with credentials provider, JWT sessions, role middleware"
```

---

### Task 1.10: Login Page + One-Click Demo Users

**Files:**
- Create: `app/(auth)/layout.tsx`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/login/login-form.tsx` (`'use client'`)

- [ ] **Create `app/(auth)/layout.tsx`**

```tsx
import { Wordmark } from '@/components/brand/wordmark'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-25 flex flex-col items-center justify-center px-4">
      <Wordmark size="md" className="mb-8" />
      {children}
    </div>
  )
}
```

- [ ] **Create `app/(auth)/login/login-form.tsx`**

```tsx
'use client'
// Client component — handles form interaction and one-click demo logins

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password required'),
})
type FormData = z.infer<typeof schema>

const DEMO_USERS = [
  { name: 'Marcus Adebayo', role: 'Contractor — Silver', email: 'marcus@adebayorenewables.co.za' },
  { name: 'Lerato Mokoena', role: 'Service Provider', email: 'lerato@mokoenaeng.co.za' },
  { name: 'Sipho Dlamini', role: 'End-Client — Enterprise', email: 'sipho@spazaholdings.co.za' },
  { name: 'Erin Berman-Levy', role: 'Platform Admin', email: 'erin@see.platform' },
]

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setError(null)
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })
    if (result?.error) {
      setError('Invalid email or password.')
    } else {
      router.push('/contractor')
      router.refresh()
    }
  }

  async function demoLogin(email: string) {
    await signIn('credentials', {
      email,
      password: 'demo1234',
      redirect: false,
    })
    // Route based on role
    if (email.includes('lerato')) router.push('/service-provider')
    else if (email.includes('sipho')) router.push('/client')
    else if (email.includes('erin')) router.push('/admin')
    else router.push('/contractor')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
            <Input label="Password" type="password" error={errors.password?.message} {...register('password')} />
            {error && <p className="text-sm text-danger-500">{error}</p>}
            <Button type="submit" className="w-full" loading={isSubmitting}>
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Demo users</CardTitle>
          <p className="text-xs text-ink-500">One-click access — no password required</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {DEMO_USERS.map(u => (
            <button
              key={u.email}
              onClick={() => demoLogin(u.email)}
              className="w-full text-left rounded-md border border-ink-200 px-4 py-3 hover:bg-ink-50 transition-colors"
            >
              <p className="text-sm font-medium text-ink-900">{u.name}</p>
              <p className="text-xs text-ink-500">{u.role}</p>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Create `app/(auth)/login/page.tsx`**

```tsx
import { LoginForm } from './login-form'

export default function LoginPage() {
  return <LoginForm />
}
```

- [ ] **Test all 4 demo logins work**

```bash
npm run dev
```

Open http://localhost:3000/login. Click each demo user. Verify redirect to appropriate role route. All 4 should work without typing passwords.

- [ ] **Commit**

```bash
git add app/(auth)/
git commit -m "feat(m2): login page with one-click demo user logins"
```

---

### Task 1.11: Role Shells (Layout + Skeleton Dashboards)

**Files:**
- Create: `components/shell/sidebar.tsx`
- Create: `components/shell/topbar.tsx`
- Create: `app/(app)/contractor/layout.tsx`
- Create: `app/(app)/contractor/page.tsx` (skeleton)
- Create: `app/(app)/service-provider/layout.tsx`
- Create: `app/(app)/service-provider/page.tsx` (skeleton)
- Create: `app/(app)/client/layout.tsx`
- Create: `app/(app)/client/page.tsx` (skeleton)
- Create: `app/(app)/admin/layout.tsx`
- Create: `app/(app)/admin/page.tsx` (skeleton)

- [ ] **Create `components/shell/topbar.tsx`** — sticky 56px bar with: Wordmark (left), search placeholder (centre), role switcher + notification bell + user avatar (right)

```tsx
import { auth } from '@/lib/auth'
import { Wordmark } from '@/components/brand/wordmark'

export async function Topbar() {
  const session = await auth()
  return (
    <header className="sticky top-0 z-40 h-14 border-b border-ink-200 bg-white flex items-center px-4 gap-4">
      <Wordmark size="sm" />
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <span className="text-xs text-ink-500">{session?.user.name}</span>
      </div>
    </header>
  )
}
```

- [ ] **Create `app/(app)/contractor/layout.tsx`**

```tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/shell/topbar'

export default async function ContractorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== 'CONTRACTOR') redirect('/login')

  return (
    <div className="flex h-screen bg-ink-25">
      <aside className="w-60 border-r border-ink-200 bg-white flex-shrink-0">
        <div className="p-4 text-xs text-ink-400">Sidebar nav (M3)</div>
      </aside>
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
```

- [ ] **Create skeleton dashboards** for each role — simple "Dashboard coming in M3/M8/M6" placeholder pages that confirm the role shell is working

- [ ] **Verify all 4 role routes are accessible and protected** — attempt to access `/admin` as a contractor and confirm redirect

- [ ] **Commit**

```bash
git add app/(app)/ components/shell/
git commit -m "feat(m2): role-based layouts and skeleton dashboards for all 4 roles"
```

---

### Task 1.12: FileUploader Component + Upload API

**Files:**
- Create: `lib/upload-rules.ts`
- Create: `app/api/upload/sign/route.ts`
- Create: `app/api/upload/finalize/route.ts`
- Create: `components/shared/file-uploader.tsx`

- [ ] **Create `lib/upload-rules.ts`**

```ts
export type UploadPurpose =
  | 'milestone_artefact'
  | 'kyc_document'
  | 'compliance_doc'
  | 'job_deliverable'
  | 'company_logo'
  | 'site_photo'
  | 'message_attachment'
  | 'proof_of_payment'

export const uploadRules: Record<UploadPurpose, { maxSizeMb: number; allowedMimeTypes: string[] }> = {
  milestone_artefact: {
    maxSizeMb: 50,
    allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  kyc_document: { maxSizeMb: 10, allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg'] },
  compliance_doc: { maxSizeMb: 10, allowedMimeTypes: ['application/pdf'] },
  job_deliverable: { maxSizeMb: 100, allowedMimeTypes: ['*'] },
  company_logo: { maxSizeMb: 2, allowedMimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml'] },
  site_photo: { maxSizeMb: 10, allowedMimeTypes: ['image/png', 'image/jpeg'] },
  message_attachment: { maxSizeMb: 25, allowedMimeTypes: ['*'] },
  proof_of_payment: { maxSizeMb: 5, allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg'] },
}
```

- [ ] **Create `app/api/upload/sign/route.ts`**

```ts
import { auth } from '@/lib/auth'
import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { uploadRules, type UploadPurpose } from '@/lib/upload-rules'

const schema = z.object({
  filename: z.string().min(1),
  size: z.number().positive(),
  mimeType: z.string().min(1),
  purpose: z.enum(['milestone_artefact', 'kyc_document', 'compliance_doc',
    'job_deliverable', 'company_logo', 'site_photo', 'message_attachment', 'proof_of_payment']),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json() as unknown
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { filename, size, mimeType, purpose } = parsed.data
  const rules = uploadRules[purpose as UploadPurpose]

  if (size > rules.maxSizeMb * 1024 * 1024) {
    return NextResponse.json({ error: `File too large. Max ${rules.maxSizeMb}MB.` }, { status: 400 })
  }
  if (!rules.allowedMimeTypes.includes('*') && !rules.allowedMimeTypes.includes(mimeType)) {
    return NextResponse.json({ error: 'File type not allowed.' }, { status: 400 })
  }

  const blobPath = `${purpose}/${session.user.companyId}/${Date.now()}-${filename}`
  const { url } = await put(blobPath, new Uint8Array(0), {
    access: 'public',
    contentType: mimeType,
    addRandomSuffix: true,
  })

  return NextResponse.json({ uploadUrl: url, blobPath })
}
```

- [ ] **Create `components/shared/file-uploader.tsx`** — `'use client'` component with drag-drop zone, per-file progress bars, calls `/api/upload/sign` then XHR PUT to blob URL, calls onComplete with upload metadata array

- [ ] **Test upload flow** — create a test page at `/test-upload` temporarily, confirm a file uploads to Vercel Blob and the URL is returned

- [ ] **Remove test page after verification**

- [ ] **Commit**

```bash
git add lib/upload-rules.ts app/api/upload/ components/shared/file-uploader.tsx
git commit -m "feat(m2): FileUploader component with direct-to-Blob upload flow"
```

---

### Task 1.13: Phase 1 Review Gate Verification

- [ ] **Run full lint + typecheck + unit tests**

```bash
npm run lint && npm run typecheck && npm run test:unit
```

Expected: all pass, zero errors.

- [ ] **Verify demo login for all 4 roles**

Start dev server, open http://localhost:3000/login, click each demo user, confirm correct role shell renders.

- [ ] **Verify seed data visible**

Open Prisma Studio (`npm run db:studio`) — confirm 4 users, companies, 12+ projects, milestones with mixed states.

- [ ] **Verify file upload end-to-end**

Use the KYC upload scaffold (or FileUploader test) to upload a PDF — confirm it appears in Vercel Blob dashboard.

- [ ] **Final commit for Phase 1**

```bash
git add -A
git commit -m "feat: complete Phase 1 — shell, data model, auth, file uploads"
```

> **⛔ STOP HERE. Present Phase 1 for review before continuing to Phase 2.**

---

## ═══════════════════════════════════════
## PHASE 2 — Contractor Hero Flow
## M3 → M4 (sequential)
## ═══════════════════════════════════════

> **Before starting:** Invoke `frontend-design` skill for design review of dashboard and project workspace.
> **REVIEW GATE:** Marcus logs in → dashboard widgets populated → opens Project Alpha → milestone tracker with mixed states → submits a milestone → status changes to Under Review.

### Task 2.1: Contractor Sidebar + Navigation Shell

**Files:** `components/shell/sidebar.tsx`, `app/(app)/contractor/layout.tsx` (update)

- [ ] Build full sidebar: SEE wordmark, nav links (Dashboard, Projects, Marketplace, Service Centre, Wallet, Company), tier badge + token balance at bottom, collapse to 64px icon-only on toggle
- [ ] Wire active states to current route using `usePathname()`
- [ ] Add `'use client'` to sidebar only (interactivity required for collapse)
- [ ] Update contractor layout to use full sidebar
- [ ] **Commit:** `feat(m3): contractor sidebar with nav, tier badge, token balance`

---

### Task 2.2: Contractor Dashboard (6 Widgets)

**Files:** `app/(app)/contractor/page.tsx`, `server/queries/dashboard.ts`, `components/dashboard/*.tsx`

- [ ] Write server query `getDashboardData(companyId)` — fetches: project counts by stage, upcoming events, milestone watch items (at-risk milestones), token balance, tier status, top news items, AI suggestion cards (seeded static)
- [ ] Build `StatsRow` — 4 numbers (Active Projects, Pipeline Value, Tokens, Tier) — typography only, no card backgrounds
- [ ] Build `MilestoneWatch` — list of milestones with status chips and due dates
- [ ] Build `NewsfeedSidebar` — rotating news items from seed, `NewsItem` model, truncated with "Read more" link
- [ ] Build `AiSuggestionsCard` — static seeded suggestions with dismiss
- [ ] Build `CalendarWidget` — upcoming O&M events list
- [ ] Compose dashboard page as Server Component fetching from `getDashboardData`
- [ ] **Unit test:** `getDashboardData` returns correct project counts for seeded data
- [ ] **Commit:** `feat(m3): contractor dashboard with 6 widgets from seed data`

---

### Task 2.3: Company Profile Module

**Files:** `app/(app)/contractor/company/page.tsx`, `server/queries/company.ts`, `server/actions/kyc.ts`

- [ ] Build Company Profile page: KYC status banner, compliance documents list, BEEE level, bank details (masked), profile settings form (name, about, phone, email)
- [ ] Wire KYC status from seed (Adebayo Renewables = APPROVED)
- [ ] Build compliance document upload using `<FileUploader purpose="compliance_doc">`
- [ ] Add "Generate Company Profile" button — mocked PDF download animation (button → loading 2s → "Downloading..." → done)
- [ ] **Commit:** `feat(m3): company profile module with KYC status and compliance docs`

---

### Task 2.4: Projects Grid

**Files:** `app/(app)/contractor/projects/page.tsx`, `server/queries/projects.ts`, `components/project/project-card.tsx`

- [ ] Write `getProjects(companyId)` server query with filtering by stage, technology, search
- [ ] Build `ProjectCard` — shows: project name, client name, stage badge, system size, deal structure, completion percentage bar, tier indicator if milestone has AUTO_GOLD
- [ ] Build Projects grid page: filterable by stage + technology, search by name, "New Project" button
- [ ] Build empty state for zero projects
- [ ] **Unit test:** project filtering logic
- [ ] **Commit:** `feat(m4): projects grid with filtering and project cards`

---

### Task 2.5: New Project Wizard + Logic Engine

**Files:** `app/(app)/contractor/projects/new/page.tsx`, `lib/milestone-templates.ts`, `server/actions/projects.ts`

- [ ] **Unit tests first** for `selectMilestoneTemplate(technology, systemSizeKw, dealStructure)`:

```ts
// tests/unit/milestone-templates.test.ts
import { describe, it, expect } from 'vitest'
import { selectMilestoneTemplate } from '@/lib/milestone-templates'

describe('selectMilestoneTemplate', () => {
  it('selects Solar C&I <1MW Outright for small solar outright', () => {
    const result = selectMilestoneTemplate('SOLAR_PV', 250, 'OUTRIGHT')
    expect(result.name).toContain('C&I')
    expect(result.dealStructure).toContain('OUTRIGHT')
  })
  it('selects PPA template for PPA deal structure', () => {
    const result = selectMilestoneTemplate('SOLAR_PV', 500, 'PPA')
    expect(result.dealStructure).toContain('PPA')
  })
})
```

- [ ] Run tests — expect FAIL (not implemented)
- [ ] Implement `lib/milestone-templates.ts`:

```ts
import { db } from '@/lib/db'
import type { DealStructure, Technology } from '@prisma/client'

export async function selectMilestoneTemplate(
  technology: Technology,
  systemSizeKw: number,
  dealStructure: DealStructure
) {
  const templates = await db.milestoneTemplate.findMany({
    where: {
      technology,
      isActive: true,
      dealStructure: { has: dealStructure },
      OR: [
        { minSizeKw: null },
        { minSizeKw: { lte: systemSizeKw } },
      ],
    },
    include: { items: { orderBy: { order: 'asc' } } },
    orderBy: { version: 'desc' },
  })

  const match = templates.find(t =>
    (!t.maxSizeKw || t.maxSizeKw >= systemSizeKw) &&
    (!t.minSizeKw || t.minSizeKw <= systemSizeKw)
  )
  if (!match) throw new Error(`No template for ${technology} ${systemSizeKw}kW ${dealStructure}`)
  return match
}
```

- [ ] Run tests — expect PASS
- [ ] Build 4-step wizard: Intake Form (Client/Site/Technical/Commercial inputs) using React Hook Form + Zod
- [ ] Build `createProject` server action — calls `selectMilestoneTemplate`, creates Project + Site + Milestone rows, awards 2,000 tokens
- [ ] **Commit:** `feat(m4): new project wizard with milestone template Logic Engine`

---

### Task 2.6: Project Workspace — Overview + Milestones Tabs

**Files:** `app/(app)/contractor/projects/[id]/page.tsx`, `app/(app)/contractor/projects/[id]/milestones/page.tsx`, `components/milestone/milestone-tracker.tsx`, `components/milestone/milestone-item.tsx`

- [ ] Build Project Workspace shell with 3-tab navigation (Overview | Milestones | Monitoring — locked)
- [ ] Build Overview tab: editable project metadata, client info, deal structure summary, client needs
- [ ] Build `MilestoneTracker` — vertical timeline, milestones ordered by `order`, hard-gate locks (LOCKED status = greyed out with lock icon), status chips (LOCKED / AVAILABLE / IN_PROGRESS / SUBMITTED / UNDER_REVIEW / APPROVED / AUTO_GOLD)
- [ ] Wire Project Alpha from seed — show 3 approved, 1 auto-gold, 1 under-review, 1 available
- [ ] **Commit:** `feat(m4): project workspace overview and milestone tracker`

---

### Task 2.7: Milestone Submission Flow

**Files:** `components/milestone/submission-form.tsx`, `server/actions/milestones.ts`, `app/api/milestones/[id]/submit/route.ts`

- [ ] Build submission form: `<FileUploader purpose="milestone_artefact">`, notes field, "Submit for Review" button
- [ ] Build `submitMilestone` server action — creates `MilestoneSubmission`, transitions milestone status to SUBMITTED, posts system message to comms thread (stub for now), awards tokens
- [ ] Build document version history — list all submissions for a milestone oldest→newest with status
- [ ] Build "Get Service" bridge button on milestone — navigates to marketplace RFQ pre-filled with milestone context (stub link for now — wired in Phase 4)
- [ ] **Unit test:** `submitMilestone` transitions milestone status correctly and records submission
- [ ] **Commit:** `feat(m4): milestone submission flow with artefact upload and version history`

---

### Task 2.8: Phase 2 Review Gate Verification

- [ ] Run `npm run lint && npm run typecheck && npm run test:unit`
- [ ] Demo flow: login as Marcus → dashboard widgets loaded → open Project Alpha → milestone tracker shows correct mixed states → submit a milestone artefact → status transitions to UNDER_REVIEW
- [ ] **Commit:** `feat: complete Phase 2 — contractor dashboard and project management system`

> **⛔ STOP HERE. Present Phase 2 for review before continuing to Phase 3.**

---

## ═══════════════════════════════════════
## PHASE 3 — Governance Layer
## M4.5 → [M5 ‖ M6]
## ═══════════════════════════════════════

> **BEFORE STARTING:** Invoke `dispatching-parallel-agents` skill after M4.5 lands — M5 and M6 run as parallel subagents.
> **REVIEW GATE:** Submit milestone → AI verification animation → admin approve → comms thread system message → tier badge updates.

### Task 3.1: Project Comms Schema + Workspace (M4.5)

**Files:** `prisma/schema.prisma` (add comms models), `server/actions/projects.ts` (auto-create workspace on project create)

- [ ] Add comms schema additions from `docs/plan/08_COMMUNICATIONS.md` §"Schema additions": `ProjectWorkspace`, `Channel`, `ChannelMembership`, `Message`, `MessageReaction` models
- [ ] Patch `User`, `Project`, `Milestone` models with back-relations
- [ ] Run migration: `npx prisma migrate dev --name add_project_comms`
- [ ] Update `createProject` action to auto-create ProjectWorkspace with 4 default channels + seed memberships
- [ ] **Commit:** `feat(m4.5): project comms schema and workspace auto-creation`

---

### Task 3.2: Comms Channel UI (M4.5)

**Files:** `components/comms/*.tsx`, `app/(app)/contractor/projects/[id]/page.tsx` (add comms pane)

- [ ] Build channel sidebar (list of channels, unread counts)
- [ ] Build message timeline (chronological messages, author avatar, timestamp, markdown rendering)
- [ ] Build message composer (textarea with @-mention, #-channel-ref, file attachment, send button)
- [ ] Add polling: `useQuery` refetch every 3s on active channel, 15s on sidebar
- [ ] Build thread drawer (slide-in panel for threaded replies)
- [ ] Add comms pane to Project Workspace as a 4th panel (right side, resizable)
- [ ] Build global inbox in topbar (unread mentions across all projects)
- [ ] **Commit:** `feat(m4.5): comms channel UI with polling, threads, and inbox`

---

### Task 3.3: Comms Seed Data (M4.5)

**Files:** `prisma/seed.ts` (add ~80 messages to Project Alpha)

- [ ] Add Project Alpha workspace with 4 channels and ~80 messages to seed — include the rejected-EIA conversation thread, Auto-Gold marketplace flow messages, current open mentions
- [ ] Run `npm run db:reset` to verify seed populates comms correctly
- [ ] **Commit:** `feat(m4.5): seed 80 messages into Project Alpha comms workspace`

---

> **AFTER TASK 3.3 MERGES:** Spawn parallel subagents for Tasks 3.4–3.7 (M5) and Tasks 3.8–3.11 (M6) simultaneously.

### Task 3.4: Tier Rules Engine + Unit Tests (M5 — subagent)

**Files:** `lib/tier-rules.ts`, `tests/unit/tier-rules.test.ts`

- [ ] Write failing tests:

```ts
// tests/unit/tier-rules.test.ts
import { describe, it, expect } from 'vitest'
import { getTierForCompliantCount, getTierCashbackRate } from '@/lib/tier-rules'

describe('getTierForCompliantCount', () => {
  it('returns BRONZE for 0 compliant projects', () => expect(getTierForCompliantCount(0)).toBe('BRONZE'))
  it('returns SILVER for 3 compliant projects', () => expect(getTierForCompliantCount(3)).toBe('SILVER'))
  it('returns GOLD for 8 compliant projects', () => expect(getTierForCompliantCount(8)).toBe('GOLD'))
  it('returns PLATINUM for 15 compliant projects', () => expect(getTierForCompliantCount(15)).toBe('PLATINUM'))
})
describe('getTierCashbackRate', () => {
  it('returns 2% for BRONZE', () => expect(getTierCashbackRate('BRONZE')).toBe(0.02))
  it('returns 5% for PLATINUM', () => expect(getTierCashbackRate('PLATINUM')).toBe(0.05))
})
```

- [ ] Run — FAIL. Implement:

```ts
import type { Tier } from '@prisma/client'

const TIER_THRESHOLDS: Record<Tier, number> = {
  BRONZE: 0, SILVER: 3, GOLD: 8, PLATINUM: 15,
}
const CASHBACK_RATES: Record<Tier, number> = {
  BRONZE: 0.02, SILVER: 0.03, GOLD: 0.04, PLATINUM: 0.05,
}

export function getTierForCompliantCount(count: number): Tier {
  if (count >= 15) return 'PLATINUM'
  if (count >= 8) return 'GOLD'
  if (count >= 3) return 'SILVER'
  return 'BRONZE'
}

export function getTierCashbackRate(tier: Tier): number {
  return CASHBACK_RATES[tier]
}

export function getNextTierThreshold(tier: Tier): number | null {
  const next: Partial<Record<Tier, Tier>> = { BRONZE: 'SILVER', SILVER: 'GOLD', GOLD: 'PLATINUM' }
  const nextTier = next[tier]
  return nextTier ? TIER_THRESHOLDS[nextTier] : null
}
```

- [ ] Run — PASS. **Commit:** `feat(m5): tier rules engine with unit tests`

---

### Task 3.5: AI Verification Agent (M5 — subagent)

**Files:** `app/api/ai/verify/route.ts`, `components/milestone/verification-animation.tsx`, `server/actions/milestones.ts` (add verify action)

- [ ] Build `POST /api/ai/verify` — accepts `{ submissionId, type: 'AI_AGENT' }`, deducts 1,000 tokens, creates `MilestoneVerification` row with status IN_PROGRESS, returns `{ verificationId }`. After 3s delay (simulated), updates to PASS/FAIL with canned findings per artefact type.
- [ ] Build `VerificationAnimation` — `'use client'` component: shimmer progress bar 0→100% over 2–4s, then reveals result card (PASS green, FAIL red, detailed findings list)
- [ ] Wire "Verify with AI (1,000 tokens)" button on submitted milestone — costs tokens, shows animation, updates status
- [ ] Build Expert Verification flow: 10,000 tokens → PENDING_EXPERT status → admin acts as expert (Phase 3 admin queue)
- [ ] **Commit:** `feat(m5): AI verification agent with animated stub and expert queue`

---

### Task 3.6: Tier Badge + Progression Animation (M5 — subagent)

**Files:** `components/brand/tier-badge.tsx`, `components/dashboard/tier-progress-card.tsx`

- [ ] Build `TierBadge` component: Bronze/Silver/Gold/Platinum with correct restrained colour treatment, letter-spaced text, subtle border
- [ ] Add tier badge to contractor topbar and sidebar
- [ ] Build `TierProgressCard` for dashboard — shows current tier, compliant project count, bar to next tier, cashback rate. This is one of the few accent-coloured elements on the dashboard.
- [ ] Build tier progression animation with Framer Motion — triggered when `compliantProjectCount` crosses a threshold: celebration moment (500–800ms), tier badge transitions, confetti-light effect (dots, not actual confetti — restraint)
- [ ] Wire auto-progression: when admin approves a milestone submission, recompute tier
- [ ] **Commit:** `feat(m5): tier badge, progress card, and progression animation`

---

### Task 3.7: Gold Standard Certificate + Auto-Gold (M5 — subagent)

**Files:** `server/actions/milestones.ts` (add auto-gold logic)

- [ ] Add auto-Gold logic: when a Job Card deliverable is uploaded and linked to a milestone, transition milestone to AUTO_GOLD status
- [ ] Build "Gold Standard Certificate" button on fully-approved project — mocked: button → 2s "Generating..." animation → "Download" button (no real PDF)
- [ ] Add tier-gated feature lock: Leads section in sidebar shows lock icon with "Silver tier required" tooltip for Bronze contractors
- [ ] **Commit:** `feat(m5): auto-gold milestone flow and Gold Standard cert mock`

---

### Task 3.8: Admin Dashboard + KYC Queue (M6 — subagent)

**Files:** `app/(app)/admin/page.tsx`, `app/(app)/admin/kyc/page.tsx`, `server/queries/admin.ts`

- [ ] Build Admin Dashboard: system stats (total projects, pending KYC, pending milestone reviews, registered companies), queue count badges
- [ ] Build KYC Approval Queue: table of pending submissions, click to expand (3 document previews using `react-pdf`), Approve / Reject / Request Info buttons
- [ ] Wire `approveKyc` server action — updates KycSubmission status, sends notification
- [ ] **Commit:** `feat(m6): admin dashboard and KYC approval queue`

---

### Task 3.9: Milestone Submission Review Portal (M6 — subagent)

**Files:** `app/(app)/admin/milestones/page.tsx`, `components/shared/pdf-viewer.tsx`

- [ ] Build Milestone Submission Review Portal: queue of UNDER_REVIEW submissions, filterable by project/contractor/milestone
- [ ] Build submission detail view: PDF viewer (`react-pdf`) for each artefact, side-by-side annotation notes field, Approve / Reject with feedback / Request Info actions
- [ ] Wire `reviewMilestoneSubmission` server action — transitions status, creates notification, posts system message to comms thread, recalculates tier if approved
- [ ] **Commit:** `feat(m6): milestone submission review portal with PDF viewer`

---

### Task 3.10: Template Builder + User Management (M6 — subagent)

**Files:** `app/(app)/admin/templates/page.tsx`, `app/(app)/admin/users/page.tsx`

- [ ] Build Template Configuration UI: list of milestone templates, click to edit (list-and-form editor for template items — drag-drop is stretch goal), version bump on save
- [ ] Build Rules Engine UI: IF/THEN rules (e.g., IF size > 1MW THEN include "Grid Impact Study") — form-based, no drag-drop required
- [ ] Build User Management: searchable table of users, role assignment dropdown, tier override (admin only), account status toggle
- [ ] **Commit:** `feat(m6): milestone template builder and user management`

---

### Task 3.11: Phase 3 Review Gate Verification

- [ ] Run `npm run lint && npm run typecheck && npm run test:unit`
- [ ] Full flow: submit milestone → click "Verify with AI" → animation plays → result shown → admin approves → comms thread receives system message → contractor tier badge updates if threshold crossed
- [ ] Verify comms: Project Alpha workspace has all 4 channels, seed messages visible, can post a new message
- [ ] **Commit:** `feat: complete Phase 3 — governance layer (comms + verification + admin)`

> **⛔ STOP HERE. Present Phase 3 for review before continuing to Phase 4.**

---

## ═══════════════════════════════════════
## PHASE 4 — Marketplaces
## M7a ‖ M7b (parallel subagents from the start)
## ═══════════════════════════════════════

> **BEFORE STARTING:** Invoke `dispatching-parallel-agents` — spawn M7a (Service) and M7b (Hardware) simultaneously.
> **REVIEW GATE:** RFQ→Bid→Job Card→deliverable (auto-Gold). Hardware cart checkout mock with token discount.

### Task 4.1: Service Provider Directory + RFQ Flow (M7a — subagent)

**Files:** `app/(app)/contractor/marketplace/page.tsx`, `components/marketplace/sp-directory.tsx`, `components/marketplace/rfq-form.tsx`

- [ ] Build SP Directory: grid of service providers grouped by category (5 categories), filter by category + service area, rating display, response time
- [ ] Build SP profile page: headline, description, rating history, portfolio items (seeded), "Request Service" CTA
- [ ] Build RFQ creation form: title, scope of work, budget, deadline, linked milestone selector — pre-fills if accessed from "Get Service" milestone bridge
- [ ] Wire "Get Service" bridge from milestone → navigates to `/contractor/marketplace?milestone=<id>` with pre-fill
- [ ] Build `createRfq` server action
- [ ] **Commit:** `feat(m7a): SP directory and RFQ creation with milestone bridge`

---

### Task 4.2: Service Provider Role — Opportunity Board + Job Cards (M7a — subagent)

**Files:** `app/(app)/service-provider/page.tsx`, `app/(app)/service-provider/jobs/[id]/page.tsx`, `components/marketplace/job-card-kanban.tsx`

- [ ] Build SP Opportunity Board: open RFQs matching SP categories, bid submission form (amount, proposal text, estimated days)
- [ ] Build Job Card Kanban: 4 columns (Bids Submitted / Active / Pending Review / Completed), drag cards between columns
- [ ] Build Job Card detail: scope, amount, escrow status, deliverable upload (`<FileUploader purpose="job_deliverable">`), contextual chat
- [ ] Wire deliverable upload to linked milestone: on upload, transition milestone to AUTO_GOLD
- [ ] Build SP review form (star rating + text, submitted by contractor on job completion)
- [ ] **Commit:** `feat(m7a): SP role — opportunity board, job card Kanban, deliverable upload`

---

### Task 4.3: Hardware Marketplace (M7b — subagent)

**Files:** `app/(app)/contractor/marketplace/hardware/page.tsx`, `components/marketplace/hardware-grid.tsx`, `components/marketplace/cart.tsx`

- [ ] Build hardware browse: category tabs (Panels/Batteries/Inverters/Generators/Accessories), product cards with image, specs, price
- [ ] Build product detail page: full specs, stock qty, price, token discount calculator, "Add to Cart"
- [ ] Build cart sidebar: item list, subtotal, token discount slider, total after discount, "Checkout" CTA
- [ ] Build PayFast mock checkout: redirect animation → mock success/failure page → order status PAID
- [ ] Wire cashback token earning: on order PAID, credit tokens per tier cashback rate
- [ ] Build affiliate-link fallback for non-partnered suppliers (external link with tracking parameter)
- [ ] **Commit:** `feat(m7b): hardware marketplace with cart, PayFast mock, and token cashback`

---

### Task 4.4: Phase 4 Review Gate Verification

- [ ] Full service flow: post RFQ from Project Alpha milestone → switch to Lerato (SP) → bid → switch back to Marcus → accept bid → escrow locked → Job Card active → Lerato uploads deliverable → milestone transitions to AUTO_GOLD
- [ ] Hardware flow: browse inverters → add to cart → apply token discount → mock checkout → order PAID → tokens credited
- [ ] **Commit:** `feat: complete Phase 4 — service and hardware marketplaces`

> **⛔ STOP HERE. Present Phase 4 for review before continuing to Phase 5.**

---

## ═══════════════════════════════════════
## PHASE 5 — Commercial Substrate
## M8 ‖ M9 (parallel subagents)
## ═══════════════════════════════════════

> **BEFORE STARTING:** Invoke `dispatching-parallel-agents` — spawn M8 and M9 simultaneously.
> **REVIEW GATE:** License paywall activation moment. Enterprise dashboard. O&M charts with live data.

### Task 5.1: End-Client Role + Plant Dashboard (M8 — subagent)

**Files:** `app/(app)/client/page.tsx`, `app/(app)/client/sites/[id]/page.tsx`, `components/om/plant-dashboard.tsx`, `components/om/production-chart.tsx`

- [ ] Build Client Portfolio: list of sites with plant health indicator, license tier badge, quick-link to plant dashboard
- [ ] Build Plant Dashboard: production kWh chart (Recharts, 30-day view with day/week/month toggle), SoC % gauge, consumption vs grid import/export, irradiance vs performance overlay
- [ ] Build multi-brand normalisation tabs: WEG / Victron / SunSynk / Deye — all show identical normalised data (data from OmReading, `inverterBrand` field used for tab label only)
- [ ] Build O&M Schedule: calendar view of upcoming events, create event form, link report/invoice attachment
- [ ] Build Handover Document Repository: file list grouped by category, upload via `<FileUploader>`
- [ ] Build Prescriptive Maintenance alerts (Kruger Family Farm AI tier): seeded alert cards ("Inverter error 404 — schedule technician"), acknowledge button
- [ ] **Commit:** `feat(m8): end-client role with plant dashboard, O&M schedule, prescriptive alerts`

---

### Task 5.2: Payment Rail Logic + Unit Tests (M9 — subagent)

**Files:** `lib/payments/rail.ts`, `lib/payments/invoice.ts`, `tests/unit/payment-rail.test.ts`

- [ ] Write failing tests:

```ts
// tests/unit/payment-rail.test.ts
import { describe, it, expect } from 'vitest'
import { suggestPaymentRail } from '@/lib/payments/rail'

describe('suggestPaymentRail', () => {
  it('always returns PAYFAST for TOKEN_PURCHASE', () =>
    expect(suggestPaymentRail(5_000_000, 'TOKEN_PURCHASE')).toBe('PAYFAST'))
  it('returns PAYFAST for amounts under R10k', () =>
    expect(suggestPaymentRail(500_000, 'LICENSE_ACTIVATION')).toBe('PAYFAST'))
  it('returns EFT for amounts R10k+', () =>
    expect(suggestPaymentRail(1_000_000, 'LICENSE_ACTIVATION')).toBe('EFT'))
})
```

- [ ] Run — FAIL. Implement `lib/payments/rail.ts`:

```ts
export type PaymentPurpose = 'TOKEN_PURCHASE' | 'SUBSCRIPTION_FEE' | 'LICENSE_ACTIVATION' | 'ESCROW_DEPOSIT' | 'HARDWARE_ORDER' | 'PLATFORM_FEE'
export type PaymentRail = 'EFT' | 'PAYFAST'

export function suggestPaymentRail(amountCents: number, purpose: PaymentPurpose): PaymentRail {
  if (purpose === 'TOKEN_PURCHASE' || purpose === 'SUBSCRIPTION_FEE') return 'PAYFAST'
  if (amountCents < 1_000_000) return 'PAYFAST'
  return 'EFT'
}
```

- [ ] Run — PASS. Implement `lib/payments/invoice.ts` — `generateInvoiceRef()` returning `SEE-INV-${randomAlphanumeric(4)}-${year}`
- [ ] **Commit:** `feat(m9): payment rail selection logic with unit tests`

---

### Task 5.3: EFT Flow + EFT Modal (M9 — subagent)

**Files:** `components/payments/eft-modal.tsx`, `app/api/payments/route.ts`, `server/actions/payments.ts`

- [ ] Build `EftModal` — shows: invoice details, platform banking details, reference (copy button), POP upload zone (`<FileUploader purpose="proof_of_payment">`), "I've made the payment" confirm button
- [ ] Build `createPayment` server action — creates Invoice + Payment records, status AWAITING_RECONCILIATION
- [ ] Build Demo Mode bypass: if `NEXT_PUBLIC_DEMO_MODE=true`, auto-reconcile after 5s with animation
- [ ] Build Admin Reconciliation Queue — table of AWAITING_RECONCILIATION payments, POP viewer, "Confirm Received" action
- [ ] **Commit:** `feat(m9): EFT flow with invoice, POP upload, and demo mode auto-reconciliation`

---

### Task 5.4: OmLicense Paywalls + Activation Animation (M9 — subagent)

**Files:** `components/payments/license-activation.tsx`, `server/actions/licensing.ts`

- [ ] Build OmLicense schema additions from `docs/plan/09_PAYMENTS_AND_LICENSING.md` — run migration
- [ ] Build paywall overlay on contractor Project Tab C: tier selector (Basic/Premium/AI), pricing, "Activate" CTA
- [ ] Build license offer flow: EPC proposes license to client → LicenseOffer record created → client sees pending offer
- [ ] Build client accept flow: client reviews offer → accepts → EFT invoice issued → payment → activation
- [ ] Build license activation animation (Framer Motion): paywall div transitions opacity 1→0 while dashboard div transitions opacity 0→1 over 600ms — the demo moment
- [ ] Wire commission credits: on client payment confirmed, credit EPC's wallet with commission
- [ ] **Commit:** `feat(m9): OmLicense paywalls, license activation animation, EPC commissions`

---

### Task 5.5: Enterprise Tier — Spaza Holdings (M9 — subagent)

**Files:** `app/(app)/client/enterprise/page.tsx` (or redirect from client root), `components/payments/enterprise-dashboard.tsx`

- [ ] Add Enterprise schema from `docs/plan/09_PAYMENTS_AND_LICENSING.md` §Enterprise — run migration
- [ ] Build Enterprise client routing: Sipho Dlamini's session detects EnterpriseLicense → redirect to `/client/enterprise` instead of `/client`
- [ ] Build Enterprise Dashboard: co-branded topbar ("SEE × SPAZA HOLDINGS"), 4-section sidebar (Operations / Reports / Integrations / Admin), custom widget renderer consuming layout config from seed
- [ ] Build Operations section: project portfolio with enterprise-specific views
- [ ] Build Integration management UI: API keys (mocked), webhook list, scheduled export configs
- [ ] Build Admin scope addition flow: admin adds Boksburg project to Spaza Enterprise scope → propagates immediately
- [ ] **Commit:** `feat(m9): Enterprise tier — Spaza Holdings dashboard and scope management`

---

### Task 5.6: Wallet Upgrades + Reseller View (M9 — subagent)

**Files:** `app/(app)/contractor/wallet/page.tsx`

- [ ] Build unified Wallet page: 3 tabs (Tokens / Fiat / Commissions)
- [ ] Tokens tab: balance, transaction history (earn/spend), top-up button (PayFast mock)
- [ ] Fiat tab: escrow balance, pending payouts, transaction history
- [ ] Commissions tab: recurring earnings from license resales, active licenses sold, upsell opportunities, upcoming payout date
- [ ] **Commit:** `feat(m9): wallet with tokens, fiat, and reseller commissions tabs`

---

### Task 5.7: Phase 5 Review Gate Verification

- [ ] Full license flow: Marcus proposes Premium license to Durbanville Mall → switch to Tess (client) → accepts → EFT invoice → Demo Mode auto-reconciles → paywall animation → both dashboards active
- [ ] Enterprise: login as Sipho → Enterprise dashboard renders with Spaza branding
- [ ] O&M charts: Kruger Family Farm plant dashboard shows 90 days of replayed production data
- [ ] **Commit:** `feat: complete Phase 5 — commercial substrate, payments, licensing, enterprise`

> **⛔ STOP HERE. Present Phase 5 for review before continuing to Phase 6.**

---

## ═══════════════════════════════════════
## PHASE 6 — SEE.AI Assistant + Full Polish
## M10 (sequential, holistic)
## ═══════════════════════════════════════

> **Before starting:** Invoke `frontend-design` skill for empty states + polish review.
> **REVIEW GATE (Demo-Ready Sign-off):** Full 28-step dry-run. SEE.AI contextual. All 4 roles one-click. No console errors. Vercel production URL live.

### Task 6.1: SEE.AI Chat Widget

**Files:** `components/ai/chat-widget.tsx`, `components/ai/chat-message.tsx`, `app/api/ai/chat/route.ts`, `lib/anthropic.ts`, `lib/ai-tools.ts`

- [ ] **Create `lib/anthropic.ts`**

```ts
import Anthropic from '@anthropic-ai/sdk'
export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
```

- [ ] **Create `lib/ai-tools.ts`** — define 5 tool schemas for Claude tool use:

```ts
import type Anthropic from '@anthropic-ai/sdk'

export const seeAiTools: Anthropic.Tool[] = [
  {
    name: 'get_project_details',
    description: 'Get details about a specific project by name or ID',
    input_schema: {
      type: 'object' as const,
      properties: { projectId: { type: 'string' } },
      required: ['projectId'],
    },
  },
  {
    name: 'list_projects_at_risk',
    description: 'List contractor projects with overdue milestones or stalled status',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'summarise_milestone_status',
    description: 'Summarise the milestone completion status for a project',
    input_schema: {
      type: 'object' as const,
      properties: { projectId: { type: 'string' } },
      required: ['projectId'],
    },
  },
  {
    name: 'recommend_service_provider',
    description: 'Recommend service providers for a given category and milestone',
    input_schema: {
      type: 'object' as const,
      properties: {
        category: { type: 'string' },
        milestoneId: { type: 'string' },
      },
      required: ['category'],
    },
  },
  {
    name: 'generate_company_profile_draft',
    description: 'Generate a draft company profile for the contractor',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
]
```

- [ ] **Create `app/api/ai/chat/route.ts`** — streaming endpoint with Anthropic SDK, user context in system prompt, tool call execution

```ts
import { auth } from '@/lib/auth'
import { anthropic } from '@/lib/anthropic'
import { seeAiTools } from '@/lib/ai-tools'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { messages, conversationId } = await request.json() as {
    messages: { role: string; content: string }[]
    conversationId: string | null
  }

  const company = await db.company.findFirst({
    where: { memberships: { some: { userId: session.user.id } } },
    include: { tierStatus: true, walletBalance: true },
  })

  const systemPrompt = `You are SEE.AI, the intelligent assistant for the SEE Platform — the operating system for renewable energy project developers in Southern Africa.

Current user: ${session.user.name} (${session.user.role})
Company: ${company?.name ?? 'Unknown'}
Tier: ${company?.tierStatus?.tier ?? 'BRONZE'}
Token balance: ${company?.walletBalance?.tokens ?? 0}

You are calm, technical, direct. No emoji. No exclamation marks. You help contractors manage projects, understand milestones, find service providers, and navigate the platform.`

  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages as Anthropic.MessageParam[],
    tools: seeAiTools,
  })

  return new Response(stream.toReadableStream())
}
```

- [ ] Build `ChatWidget` — `'use client'`, persistent bottom-right button (accent-500, 48px), slide-up panel (380px desktop, full-screen mobile), message bubbles, streaming text rendering, tool call result cards
- [ ] Persist conversation history in `AiConversation` + `AiMessage` tables
- [ ] Add language selector dropdown (EN/AF/ZU/PT) — Claude handles translation natively
- [ ] **Commit:** `feat(m10): SEE.AI Assistant with streaming, tool calls, and conversation history`

---

### Task 6.2: Polish Pass — Empty States + Skeletons

**Files:** Every page with a list or grid

- [ ] Audit every list/grid in the app — add `<EmptyState>` with icon, title, description, action button for: Projects grid, O&M schedule, Hardware cart, SP opportunity board, Job cards, Admin queues, Notification inbox, Comms channels (no messages)
- [ ] Audit every async data fetch — replace any spinners or blank states with `<Skeleton>` components matching the actual layout shape
- [ ] Add Suspense boundaries around every slow server component with appropriate skeleton fallbacks
- [ ] **Commit:** `feat(m10): designed empty states and skeleton loading for all lists`

---

### Task 6.3: Polish Pass — Error States + Animations

**Files:** All forms, `app/layout.tsx`, page transitions

- [ ] Audit all forms — confirm every field has inline error display (not just toasts), error messages are specific not generic
- [ ] Add `error.tsx` boundaries at route level for graceful error pages
- [ ] Add page transition: wrap page content in `<motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>` in root layout
- [ ] Add number counting animation to dashboard stats using Framer Motion `useMotionValue` + spring
- [ ] Add milestone approval stamp animation — brief scale + opacity transition when admin approves
- [ ] **Commit:** `feat(m10): error states, page transitions, and dashboard stat animations`

---

### Task 6.4: Demo Mode Toggle + Reset Button

**Files:** `app/(app)/admin/page.tsx`, `lib/demo-mode.ts`, `components/shell/topbar.tsx`

- [ ] Build Demo Mode toggle in admin panel — sets `NEXT_PUBLIC_DEMO_MODE` awareness in client state via Zustand
- [ ] Wire Demo Mode to: EFT auto-reconcile (5s), milestone auto-approve (30s after submit), tier progression trigger on demand
- [ ] Build "Reset Demo Data" button in admin panel — calls `npm run db:reset` equivalent via server action, re-seeds from canonical demo state
- [ ] Add Demo Mode indicator banner (thin accent-500 bar at top of page) when Demo Mode is active
- [ ] **Commit:** `feat(m10): demo mode toggle and reset demo data button`

---

### Task 6.5: Accessibility Audit + Mobile QA

- [ ] Run WCAG AA contrast audit on all text/background combinations — fix any failures
- [ ] Verify all interactive elements have visible focus rings (accent ring — no `outline-none` without replacement)
- [ ] Verify all forms have `<label>` elements (not placeholder-as-label)
- [ ] Add `aria-label` to icon-only buttons throughout
- [ ] Test keyboard navigation: tab through login → dashboard → project → milestone → submission flow
- [ ] Test responsive layout on iPad Pro (1024px) and iPhone 15 (390px): sidebar collapses to bottom sheet, tables become accordion lists, cards stack
- [ ] **Commit:** `feat(m10): accessibility improvements and mobile responsive QA`

---

### Task 6.6: Playwright E2E — 28-Step Demo Dry-Run

**Files:** `tests/e2e/demo-dry-run.spec.ts`

- [ ] Script the full 28-step dry-run from `docs/plan/07_TESTING.md` as Playwright tests
- [ ] Each step = one `test()` block (or `step()` within a describe) with specific assertions
- [ ] Run against Vercel preview deployment URL
- [ ] Fix any failures
- [ ] **Commit:** `test(m10): Playwright e2e — full 28-step demo dry-run`

---

### Task 6.7: Vercel Production Deployment + Final Sign-Off

- [ ] Verify all environment variables are set in Vercel dashboard
- [ ] Run `npm run build` locally — confirm zero build errors, zero TypeScript errors
- [ ] Deploy to production branch (push to `main`)
- [ ] Open Vercel production URL — run through all 4 demo user logins
- [ ] Run `npm run test:e2e` against production URL
- [ ] **Invoke `superpowers:verification-before-completion`** — run through the demo readiness checklist from `docs/plan/BUILD_PLAN.md` §"Demo readiness checklist" item by item

- [ ] **Final commit:** `feat: SEE Platform prototype — demo ready`

> **⛔ PHASE 6 COMPLETE — SEE Platform is demo-ready.**

---

## Self-Review

**Spec coverage check:**
- M0 Foundation: Tasks 1.1–1.6 ✓
- M1 Data Model: Tasks 1.7–1.8 ✓
- M2 Auth: Tasks 1.9–1.12 ✓
- M3 Dashboard: Tasks 2.1–2.3 ✓
- M4 Projects: Tasks 2.4–2.7 ✓
- M4.5 Comms: Tasks 3.1–3.3 ✓
- M5 Verification: Tasks 3.4–3.7 ✓
- M6 Admin: Tasks 3.8–3.10 ✓
- M7 Marketplaces: Tasks 4.1–4.3 ✓
- M8 O&M / Client: Task 5.1 ✓
- M9 Payments / Licensing / Enterprise: Tasks 5.2–5.6 ✓
- M10 AI + Polish: Tasks 6.1–6.7 ✓

**Unit tests defined:** milestone-templates, tier-rules, tokens, payment-rail ✓

**No placeholders:** All code blocks contain actual implementation, all commands have expected output ✓

**Type consistency:** `UploadPurpose` defined in `lib/upload-rules.ts` and used in upload API; `PaymentPurpose` / `PaymentRail` defined in `lib/payments/rail.ts`; Anthropic tool schemas use `as const` for discriminated unions ✓

**Review gates:** All 6 phase gates have specific, testable criteria ✓
