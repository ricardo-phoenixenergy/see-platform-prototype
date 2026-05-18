# 01 — Architecture

Stack, structure, conventions. Read this before writing any code.

---

## Stack summary

```
Frontend:        Next.js 15 (App Router) + React 19 + TypeScript 5 (strict)
Styling:         Tailwind CSS 4 + Radix UI primitives + CVA + tailwind-merge
Database:        Vercel Postgres (managed) + Prisma 5
Auth:            Auth.js v5 (NextAuth) with credentials + Google/Microsoft providers
State (server):  TanStack Query v5
State (form):    React Hook Form + Zod
State (UI):      Zustand (only for cross-cutting UI state — sidebars, modals, demo mode)
Validation:      Zod (shared between API and forms)
AI:              @anthropic-ai/sdk
Charts:          Recharts
Animation:       Framer Motion
File upload:     Vercel Blob (start here; UploadThing as fallback)
Email:           Resend (test mode)
Icons:           Lucide React
Date:            date-fns
PDF viewer:      react-pdf (for milestone artefact preview)
Notifications:   Sonner (toasts only — most feedback is inline)
```

---

## Project structure

```
see-platform/
├── app/                          # Next.js App Router
│   ├── (marketing)/              # Public — landing, about, etc.
│   │   └── page.tsx              # Landing per design system §8.1
│   ├── (auth)/                   # Auth pages — login, register, verify
│   │   ├── login/
│   │   ├── register/
│   │   └── verify-email/
│   ├── (app)/                    # Authenticated app
│   │   ├── contractor/           # Contractor role
│   │   │   ├── layout.tsx        # Sidebar + topbar
│   │   │   ├── page.tsx          # Dashboard
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx      # Grid
│   │   │   │   ├── new/          # Wizard
│   │   │   │   └── [id]/         # Project workspace
│   │   │   │       ├── overview/
│   │   │   │       ├── milestones/
│   │   │   │       └── monitoring/  # locked until Operational
│   │   │   ├── service-center/
│   │   │   ├── marketplace/
│   │   │   ├── wallet/
│   │   │   └── company/
│   │   ├── service-provider/
│   │   ├── client/
│   │   └── admin/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── trpc/[trpc]/route.ts  # OPTIONAL — only if we adopt tRPC, otherwise route handlers
│   │   ├── ai/chat/route.ts      # SEE.AI Assistant (streaming)
│   │   ├── ai/verify/route.ts    # Stubbed AI Verification
│   │   ├── projects/             # CRUD
│   │   ├── milestones/
│   │   ├── marketplace/
│   │   ├── wallet/
│   │   └── webhooks/
│   ├── layout.tsx                # Root layout (fonts, providers)
│   └── globals.css
├── components/
│   ├── ui/                       # Primitive components (button, input, dialog, etc.)
│   ├── brand/                    # Wordmark, logomark, brand-specific
│   ├── dashboard/                # Dashboard-specific widgets
│   ├── project/                  # Project-specific components
│   ├── milestone/                # Milestone tracker, submission, etc.
│   ├── marketplace/
│   ├── ai/                       # SEE.AI chat widget, verification animation
│   └── shared/                   # Cross-cutting (data table, empty state, etc.)
├── lib/
│   ├── auth.ts                   # Auth.js config
│   ├── db.ts                     # Prisma client (singleton)
│   ├── anthropic.ts              # Anthropic SDK client
│   ├── ai-tools.ts               # Tool definitions for SEE.AI
│   ├── milestone-templates.ts    # Logic engine for template selection
│   ├── tier-rules.ts             # Tier progression rules
│   ├── tokens.ts                 # Token earning/spending logic
│   ├── permissions.ts            # Role-based permission helpers
│   ├── utils.ts                  # cn, formatters, etc.
│   └── constants.ts
├── server/
│   ├── actions/                  # Server actions (mutations)
│   │   ├── projects.ts
│   │   ├── milestones.ts
│   │   └── ...
│   └── queries/                  # Server-side data fetchers
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   ├── seed.ts                   # Full demo seed
│   └── seed-empty.ts             # Reset to empty state
├── types/
│   ├── prisma.ts                 # Extended Prisma types
│   └── api.ts                    # Zod schemas + inferred types
├── public/
│   ├── fonts/                    # Self-hosted brand typeface
│   ├── brand/                    # Wordmark SVGs
│   └── seed-assets/              # Demo PDFs, images for seed data
├── tests/
│   ├── unit/                     # Vitest
│   └── e2e/                      # Playwright
├── .env.example
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

**Route group convention:**
- `(marketing)` — unauthenticated, public
- `(auth)` — unauthenticated, auth flow
- `(app)` — authenticated, role-gated by middleware

---

## Authentication & authorisation

**Auth.js v5 (NextAuth)** with the following providers:
- `Credentials` — email + password (primary for demos; seeded demo users)
- `Google` — scaffolded, env-gated
- `Microsoft / Azure AD` — scaffolded, env-gated

**Session strategy:** JWT (faster, simpler than DB sessions for the prototype).

**Role model:** A user has one or more `Membership` records. Each Membership links to a `Company` and assigns a `Role` (`CONTRACTOR`, `SERVICE_PROVIDER`, `CLIENT`, `ADMIN`). The Journey doc specifies that Service Providers can be Contractors too — this is supported via multiple memberships. The active role is held in the session and switchable via the topbar.

**Middleware:** `middleware.ts` at the root protects all `(app)` routes. Role-specific routes (`/admin/*` etc.) are gated by checking the active session role. Unauthorised access redirects to the role's dashboard.

**Demo login page (`/login`):** Standard email/password form, plus a "Demo Users" card below offering four one-click logins:
- Marcus Adebayo — Contractor (Silver tier)
- Lerato Mokoena — Service Provider (Structural Engineer)
- Sipho Dlamini — End-Client (3 sites)
- Erin Berman-Levy — Platform Admin

This lets a presenter switch roles in one click during a live demo. **No password input required for these.**

---

## Data flow

**Reads (queries):**
- Server Components fetch directly via Prisma (`server/queries/*`)
- Client Components fetch via TanStack Query hitting route handlers in `app/api/*`
- Bias strongly toward Server Components — only "go client" when interaction requires it (forms, drag-drop, chat, charts with controls)

**Writes (mutations):**
- Primary: Server Actions (`server/actions/*`) — colocated with their consumer
- API route handlers for: AI streaming, webhooks, file uploads, anything called from non-React contexts
- Every mutation revalidates relevant paths/tags

**State boundaries:**
- DB is the source of truth
- TanStack Query for server state
- Zustand only for: sidebar collapse, modal stack, current-role for role-switcher, demo mode toggle, theme (if added)
- React Hook Form for form state — never lift form state to Zustand
- No global state for domain data — that goes in DB and through Query

---

## Type safety

**Strict mode is non-negotiable.** `tsconfig.json` enforces:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true
  }
}
```

**Validation flow:**
1. Zod schema defined in `types/api.ts`
2. Used to validate request body in route handler / server action
3. Used as `resolver` in React Hook Form
4. Inferred type used throughout

Example:
```ts
// types/api.ts
export const CreateProjectSchema = z.object({
  name: z.string().min(3).max(80),
  clientName: z.string().min(2),
  technology: z.enum(['SOLAR_PV', 'WIND', 'BESS', 'HYBRID']),
  systemSizeKw: z.number().positive(),
  dealStructure: z.enum(['OUTRIGHT', 'PPA', 'LEASE']),
  // ...
})
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>
```

**Prisma + Zod:** Use `prisma-zod-generator` to keep DB types and validation schemas aligned where it makes sense. Don't fight Prisma's types — extend them.

---

## Environment variables

`.env.example` (commit this, not `.env.local`):

```
# Database
DATABASE_URL=
DIRECT_URL=

# Auth
AUTH_SECRET=
AUTH_URL=http://localhost:3000

# OAuth (optional)
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

---

## Conventions

**File naming:**
- `kebab-case` for directories and files (`project-workspace.tsx`)
- `PascalCase` for component exports (`export function ProjectWorkspace()`)
- `camelCase` for functions and variables
- `SCREAMING_SNAKE_CASE` for constants

**Component patterns:**
- One component per file. Exception: tightly-coupled sub-components below 50 lines can colocate.
- Props named `Props`, e.g. `type Props = { ... }` then `function X({ a, b }: Props)`.
- Server Components default. Add `'use client'` only when needed and document why in a top-of-file comment.
- Co-locate test files: `project-card.tsx` + `project-card.test.tsx`.

**Imports:**
- Absolute imports via `@/` prefix (configured in tsconfig paths).
- Order: React → Next → third-party → internal `@/lib` → internal `@/components` → relative → types.
- One blank line between groups.

**Error handling:**
- Route handlers always return typed JSON; never throw.
- Server actions return a discriminated union: `{ ok: true, data } | { ok: false, error: { code, message } }`.
- Forms display errors inline next to fields, never solely as toasts.

**Styling:**
- Tailwind utility-first, no custom CSS except for the design tokens layer and any unavoidable globals.
- Use `cn()` helper (`@/lib/utils`) for conditional classes.
- Component variants via `class-variance-authority` (CVA).
- See `02_DESIGN_SYSTEM.md` for the token system.

**Accessibility:**
- All interactive elements keyboard-accessible.
- All forms have proper labels (not placeholder-as-label).
- WCAG AA contrast across all states.
- Focus rings visible (don't `outline-none` without replacing).
- Radix primitives are the default — they're a11y-correct out of the box.

---

## Deployment

**Vercel** is the deploy target.

**Setup:**
1. Connect GitHub repo
2. Add environment variables in Vercel dashboard
3. Provision Vercel Postgres from the marketplace
4. Provision Vercel Blob storage
5. Set `AUTH_SECRET` via `npx auth secret`

**Preview deployments:** Every PR gets a preview URL. Use these for stakeholder review before merging.

**Production branch:** `main`. Demo deploys from `main`. A `staging` branch can be added if needed.

**Custom domain:** Recommend `demo.see.platform` or similar. Set up at the end of M0.

---

## CI/CD

`.github/workflows/ci.yml`:

```yaml
on: [pull_request, push]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - setup node 20
      - npm ci
      - npm run lint
      - npm run typecheck
      - npm run test:unit
      - npm run build
```

E2E tests run on a schedule against a deployed preview, not in PR CI (too slow).

---

## File uploads & persistence

Files are first-class to this platform — milestone artefacts, KYC documents, job deliverables, hardware product images, compliance certificates. The pattern below is used uniformly.

### Storage architecture

- **Bytes** → **Vercel Blob** (CDN-fronted object storage, S3-compatible API)
- **Metadata** → **Postgres** via Prisma (filename, URL, size, hash, uploader, timestamps, version)
- **Relationship** → enforced by foreign keys in the schema (a `MilestoneSubmission` belongs to a `Milestone` which belongs to a `Project`)

Files are never stored in Postgres directly. The DB holds a URL pointer; the URL serves the file from Vercel's edge CDN.

### Upload flow (direct-to-Blob)

Vercel serverless functions have a ~4.5MB request body limit. EIA reports, structural drawings, and bank statements routinely exceed this. We use **client-direct uploads** with server-issued pre-signed URLs to avoid the limit.

```
[Client]                          [Next.js server]               [Vercel Blob]
   │                                     │                              │
   │  1. POST /api/upload/sign           │                              │
   │     { filename, size, mimeType }    │                              │
   │ ───────────────────────────────────▶│                              │
   │                                     │  validate auth + limits      │
   │                                     │  generate pre-signed URL     │
   │  2. { uploadUrl, blobPath }         │                              │
   │ ◀───────────────────────────────────│                              │
   │                                     │                              │
   │  3. PUT file bytes (with progress)  │                              │
   │ ────────────────────────────────────┼─────────────────────────────▶│
   │                                     │                              │
   │  4. { ok, blobUrl, sha256 }         │                              │
   │ ◀───────────────────────────────────┼──────────────────────────────│
   │                                     │                              │
   │  5. POST /api/milestones/[id]/submit│                              │
   │     { artefacts: [{ url, name, ...}]│                              │
   │ ───────────────────────────────────▶│                              │
   │                                     │  create MilestoneSubmission  │
   │                                     │  notify admin                │
   │  6. { ok, submission }              │                              │
   │ ◀───────────────────────────────────│                              │
```

### API endpoints

```
POST /api/upload/sign              Issue pre-signed Blob upload URL
  body: { filename, size, mimeType, purpose }
  returns: { uploadUrl, blobPath, expiresAt }
  - purpose: enum constraining where this file will end up
    ('milestone_artefact' | 'kyc_document' | 'compliance_doc' |
     'job_deliverable' | 'company_logo' | 'site_photo' | 'message_attachment')
  - validates: authenticated, role permits this purpose, size within purpose limit,
    mimeType in purpose allowlist
  - pre-signed URLs expire in 5 minutes

POST /api/upload/finalize          (optional — for virus scanning / processing)
  body: { blobUrl }
  returns: { ok, sha256, virusScan: 'clean' | 'pending' }
  - For prototype: skip virus scan, just compute sha256 server-side
```

### Validation rules (per purpose)

```ts
// lib/upload-rules.ts
export const uploadRules = {
  milestone_artefact: {
    maxSizeMb: 50,
    allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg',
                       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                       'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                       'application/dwg', 'image/vnd.dwg'],
  },
  kyc_document: {
    maxSizeMb: 10,
    allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg'],
  },
  compliance_doc: { maxSizeMb: 10, allowedMimeTypes: ['application/pdf'] },
  job_deliverable: { maxSizeMb: 100, allowedMimeTypes: ['*'] },
  company_logo: {
    maxSizeMb: 2,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml'],
  },
  site_photo: { maxSizeMb: 10, allowedMimeTypes: ['image/png', 'image/jpeg'] },
  message_attachment: { maxSizeMb: 25, allowedMimeTypes: ['*'] },
}
```

### Version control

Files are **never overwritten**. When a contractor uploads v2 of a rejected EIA report:

- A new Blob is written (new URL)
- A new `MilestoneSubmission` row is created with `version = 2`
- The v1 row remains, with its v1 Blob URL intact

The milestone's "current submission" is computed as the latest `MilestoneSubmission` by `createdAt`. Version history renders all submissions for the milestone, oldest to newest, with their respective statuses.

This is the audit trail the proposal references (Scope §Project Workspace 2.b.d.iii). Banks and insurers can see every iteration.

### Access control

Vercel Blob URLs are **public by default** but **unguessable** (UUID-style paths). For the prototype, this is acceptable — the URLs are long enough to be functionally private, and they're only embedded in authenticated pages.

For production handoff: switch to private blobs with signed download URLs issued by `/api/files/[id]/download`. The route validates that the requesting user has permission to read the parent entity (milestone, job card, KYC submission) before issuing a 60-second signed URL. Document this as a Phase 1 hardening task.

### Database integration

The schema in `03_DATA_MODEL.md` already has the right shape:

- `MilestoneSubmission.artefacts` — JSONB array `[{ name, url, fileSize, sha256, mimeType }]`
- `ProjectDocument` — separate model for project-level documents (not tied to a milestone)
- `KycSubmission.cipcDocUrl`, `vatDocUrl`, `directorIdUrl` — fixed slots, one file each
- `ComplianceDocument.documentUrl` — one file per compliance record
- `JobDeliverable.url` — versioned via `version` column
- `JobMessage.attachmentUrl` — optional attachment per chat message
- `Company.logoUrl` — single logo
- `HardwareListing.imageUrl` — single product image

JSONB arrays (like `artefacts`) are used where a single entity has multiple related files. Discrete columns are used where the file role is well-defined and singular.

### Client implementation

A reusable `<FileUploader>` component handles the three-step flow:

```tsx
<FileUploader
  purpose="milestone_artefact"
  maxFiles={5}
  onComplete={(uploads) => submitMilestone({ artefacts: uploads })}
/>
```

Internally it:
1. Calls `/api/upload/sign` for each selected file
2. PUTs to Vercel Blob with `XMLHttpRequest` (needed for progress events; fetch doesn't expose upload progress)
3. Tracks progress per file, shows aggregated progress bar
4. Calls `/api/upload/finalize` for each completed upload (computes sha256)
5. Returns the array of `{ name, url, fileSize, sha256, mimeType }` to the parent
6. Parent component decides what to do with the metadata (create submission, attach to message, etc.)

### Persistence guarantees

Because everything is in Postgres + Blob, persistence is automatic:

- **Across sessions** — user closes browser, returns days later, all uploads intact
- **Across deploys** — code changes don't touch data; Vercel deploys are atomic
- **Across regions** — Blob is CDN-fronted, served from the nearest edge
- **No "save draft" needed** — every successful upload is committed immediately

There is **no in-memory state** for uploads. If a user uploads two files for a milestone submission but closes the browser before clicking "Submit," the files exist in Blob but no `MilestoneSubmission` row was created. The orphaned blobs are cleaned up by a nightly job (out of scope for prototype; document for production handoff).

### Demo seed data

The seed script (`prisma/seed.ts`) needs actual files in Blob for the demo to feel real. Two options:

1. **Pre-upload demo PDFs** to a known Blob path during seed (`/seed-assets/eia-project-alpha-v1.pdf`, etc.). Store these in the repo at `/public/seed-assets/` and the seed script uploads them on first run. ✅ Recommended.
2. **Use placeholder URLs** pointing to a single generic PDF. Faster to seed, less realistic.

Option 1 is the right call for a demo. Source ~15-20 realistic-looking PDFs (EIA reports, engineering letters, compliance certs — can be lorem-ipsum-content with proper headers/layouts) and seed them into Blob.

### Out of scope for prototype

- Virus scanning (production: ClamAV via webhook on `/api/upload/finalize`)
- Server-side image optimization beyond `next/image` defaults
- OCR / text extraction from uploaded PDFs (the AI Verification Agent is stubbed; production would use Claude vision)
- Real-time collaborative annotation
- File-level audit logs (Vercel Blob's access logs are sufficient for demo)

---

## Performance budget

The prototype is not a stress test, but it must feel fast in a live demo.

- Lighthouse Performance ≥ 90 on the contractor dashboard
- First Contentful Paint < 1.5s
- No image without `next/image`
- No client-side data fetch for above-the-fold content (Server Components)
- Suspense boundaries around slow data — never block the shell

---

## Out of scope for architecture

These are conscious omissions for the prototype:

- Multi-tenancy isolation (single-tenant for demo)
- Background jobs / cron (no Inngest, no Trigger.dev — fake any delayed actions via setTimeout in demo mode)
- Real-time websockets (use polling or revalidation)
- Caching layer beyond Next.js defaults (no Redis)
- Microservices anything — monolith is correct for this scale
- Internationalisation framework (multi-language is Claude-side only, UI is English)
