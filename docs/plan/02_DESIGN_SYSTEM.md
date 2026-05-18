# 02 — Design System

The productionised version of the brand brief (`/mnt/project/SEE_Brand_Identity_Direction_v1.md`). Read the brief first; this file is the implementation layer.

**Visual reference set:** Vanta, Stripe, Linear, Mercury. If a screen could plausibly sit alongside `vanta.com`, `stripe.com`, or `linear.app` and feel like it belongs in the same category, you're in the right zone.

**The three reject tests** (run on every design decision):
1. **Phoenix-distinctness test.** Could this plausibly be a Phoenix sub-brand? If yes, reject.
2. **Energy-iconography test.** Are there panels, turbines, leaves, sunshine? If yes, reject.
3. **Vanta / Stripe / Linear texture test.** Could this sit alongside those sites? If yes, ship it.

---

## Tokens

### Colour

The palette is **cool, restrained, near-monochrome with a single accent.** The brand brief calls hex codes "the designer's job" — for the prototype, we pick now and revisit at handoff. These are locked unless explicitly rejected.

```css
:root {
  /* Neutrals — warmth-stripped, slightly cool */
  --color-ink-950: #0A0B0D;          /* near-black, primary text on light */
  --color-ink-900: #14161A;
  --color-ink-800: #1F2227;
  --color-ink-700: #2E3239;
  --color-ink-600: #4A4F58;          /* mid grey, secondary text */
  --color-ink-500: #6C7280;
  --color-ink-400: #9197A1;
  --color-ink-300: #B8BDC5;
  --color-ink-200: #D6DAE0;
  --color-ink-100: #E8EBEF;
  --color-ink-50: #F4F5F7;           /* off-white surfaces */
  --color-ink-25: #FAFAFB;           /* page background, slightly cool */
  --color-white: #FFFFFF;

  /* Accent — single deliberate accent. Deep electric blue: technical, distinct from Phoenix teal. */
  --color-accent-50: #EEF2FF;
  --color-accent-100: #DCE3FF;
  --color-accent-200: #B3C0FF;
  --color-accent-300: #889DFC;
  --color-accent-400: #5E7AF5;
  --color-accent-500: #3E5BEA;       /* primary accent */
  --color-accent-600: #2A45CC;
  --color-accent-700: #1F33A3;
  --color-accent-800: #182680;
  --color-accent-900: #121C5C;

  /* Semantic — functional only, never used for brand expression */
  --color-success-500: #1E9D6B;      /* desaturated, not lime */
  --color-warning-500: #C9892B;      /* amber, never sunshine */
  --color-danger-500: #C9384A;
  --color-info-500: var(--color-accent-500);

  /* Tier badges — recognisably medal-like but restrained */
  --color-tier-bronze: #A56A3E;
  --color-tier-silver: #8B95A0;
  --color-tier-gold: #C9A03E;
  --color-tier-platinum: #6E7A8A;

  /* Borders & dividers */
  --color-border: var(--color-ink-200);
  --color-border-strong: var(--color-ink-300);

  /* Surfaces */
  --color-bg: var(--color-ink-25);
  --color-surface: var(--color-white);
  --color-surface-muted: var(--color-ink-50);

  /* Text */
  --color-text: var(--color-ink-900);
  --color-text-muted: var(--color-ink-600);
  --color-text-subtle: var(--color-ink-500);
  --color-text-inverse: var(--color-white);
}

/* Dark mode — invert with care, not just black */
[data-theme="dark"] {
  --color-bg: #0A0B0D;
  --color-surface: #14161A;
  --color-surface-muted: #1F2227;
  --color-text: #F4F5F7;
  --color-text-muted: #B8BDC5;
  --color-text-subtle: #9197A1;
  --color-border: #2E3239;
  --color-border-strong: #4A4F58;
  /* Accent shifts slightly brighter for dark mode contrast */
  --color-accent-500: #5E7AF5;
}
```

**Forbidden colours** (per brief §3.3):
- No green of any kind (renewable cliché)
- No yellow / orange / sunshine palette (energy cliché)
- No teal in dominant range (Phoenix territory)
- No copper at saturated levels (Phoenix territory)
- **No gradients in primary surfaces.** Flat colour only. Gradients read as 2018-era startup.

**Where the accent goes:** Primary CTAs, active states, focus rings, key data emphasis, the wordmark accent stroke (if any). Used **sparingly** — restraint is the brand. A dashboard might have only one or two accent uses on screen.

### Typography

**Single technical sans, used across all weights and sizes.** No display + body split.

**Primary face: IBM Plex Sans** (open-source, technical character, broad weight range).

Alternative if budget allows licensed type at production: **Söhne** or **Aktiv Grotesk**. For the prototype, IBM Plex Sans is the default — it's free, self-hostable, and matches the posture.

**Inter is ruled out** because Phoenix uses it.

**Self-host the font** in `/public/fonts/` and reference via `next/font/local`. No Google Fonts CDN dependency in production demos.

```ts
// app/layout.tsx
import localFont from 'next/font/local'

const plexSans = localFont({
  src: [
    { path: '../public/fonts/IBMPlexSans-Regular.woff2', weight: '400' },
    { path: '../public/fonts/IBMPlexSans-Medium.woff2', weight: '500' },
    { path: '../public/fonts/IBMPlexSans-SemiBold.woff2', weight: '600' },
    { path: '../public/fonts/IBMPlexSans-Bold.woff2', weight: '700' },
  ],
  variable: '--font-sans',
  display: 'swap',
})
```

**Type scale** (modular, slightly tighter than default):

```css
:root {
  /* Size scale */
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 0.9375rem; /* 15px — slightly smaller than default for density */
  --text-md: 1rem;        /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */
  --text-4xl: 2.25rem;    /* 36px */
  --text-5xl: 3rem;       /* 48px */
  --text-6xl: 3.75rem;    /* 60px — hero only */

  /* Line height */
  --leading-tight: 1.2;
  --leading-snug: 1.35;
  --leading-normal: 1.55;
  --leading-relaxed: 1.7;

  /* Letter spacing */
  --tracking-tight: -0.02em;    /* headings */
  --tracking-snug: -0.01em;
  --tracking-normal: 0;
  --tracking-wide: 0.04em;
  --tracking-widest: 0.12em;    /* eyebrow labels, all-caps */

  /* Weights — discipline: 400 / 500 / 600 / 700 only */
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;
}
```

**Type rules** (per brief §4.4):
- **No light or thin weights** for body text. They read as fashion magazine.
- Body weight = 400. Emphasis = 500/600. Headings = 600/700.
- **No multi-family stacks.** One face, multiple weights.
- **No display fonts** (stencil, slab, condensed). Wrong category.
- All-caps reserved for eyebrows / labels only, with `tracking-widest`.

**Heading hierarchy:**

| Level | Size | Weight | Tracking | Use |
|---|---|---|---|---|
| H1 page | text-3xl → text-4xl | 600 | tight | Page title |
| H2 section | text-xl | 600 | snug | Section header |
| H3 card | text-md | 600 | snug | Card title |
| H4 label | text-sm | 600 | snug | Sub-label |
| Eyebrow | text-xs | 500 | widest, uppercase | Above a heading |

### Spacing

Tailwind's default scale, with bias toward the larger end. **Generous whitespace is itself a brand signal** (brief §7.1).

- Use `gap-` and `space-y-` for vertical rhythm
- Section padding: `py-12` desktop, `py-8` mobile minimum
- Card padding: `p-6` standard, `p-8` for emphasis
- Page max-width: `max-w-7xl` for dense screens, `max-w-4xl` for content-led pages

### Border radius

Restrained. Sharp corners are too aggressive; pill shapes are wrong category.

```css
:root {
  --radius-xs: 4px;     /* small chips, badges */
  --radius-sm: 6px;     /* inputs, small buttons */
  --radius-md: 8px;     /* cards, larger buttons */
  --radius-lg: 12px;    /* containers, modals */
  --radius-xl: 16px;    /* hero surfaces */
  --radius-full: 9999px;/* avatars, dots */
}
```

### Shadows

Restrained, used for elevation hints not for drama.

```css
:root {
  --shadow-xs: 0 1px 2px 0 rgb(10 11 13 / 0.04);
  --shadow-sm: 0 1px 3px 0 rgb(10 11 13 / 0.06), 0 1px 2px 0 rgb(10 11 13 / 0.04);
  --shadow-md: 0 4px 8px -2px rgb(10 11 13 / 0.06), 0 2px 4px -2px rgb(10 11 13 / 0.04);
  --shadow-lg: 0 12px 24px -4px rgb(10 11 13 / 0.08), 0 4px 8px -2px rgb(10 11 13 / 0.04);
  --shadow-xl: 0 24px 48px -8px rgb(10 11 13 / 0.10);
  --ring-focus: 0 0 0 3px rgb(62 91 234 / 0.22);  /* accent-500 with alpha */
}
```

---

## Tailwind config

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          25: 'rgb(var(--color-ink-25) / <alpha-value>)',
          50: 'rgb(var(--color-ink-50) / <alpha-value>)',
          // ... all scale steps
        },
        accent: { /* ... */ },
        tier: {
          bronze: 'var(--color-tier-bronze)',
          silver: 'var(--color-tier-silver)',
          gold: 'var(--color-tier-gold)',
          platinum: 'var(--color-tier-platinum)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      fontSize: { /* match CSS tokens */ },
      borderRadius: { /* match CSS tokens */ },
      boxShadow: { /* match CSS tokens */ },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config
```

---

## Brand assets

### Wordmark

The brand brief calls for a **wordmark-led identity** — three letters "SEE", typographically treated.

**For the prototype**, build a clean typographic wordmark in `/public/brand/wordmark.svg`:
- Letters "SEE" set in IBM Plex Sans SemiBold or Bold
- Slightly tighter letter-spacing than default (-0.04em)
- Black on transparent for use on light surfaces; white on transparent for dark
- Provide three variants: `wordmark.svg`, `wordmark-mono.svg` (single-colour for monochrome contexts), `wordmark-mark-only.svg` (a compact lockup for small contexts)

**Reject patterns** (brief §5.4):
- No literal eye iconography
- No sun / panel / leaf / energy iconography
- No hexagons
- No mascots, characters, illustrations

**The double-E lockup** (brief §5.3 Direction B) — if a logo designer brings something elegant later, we slot it in. For the prototype, a pure typographic wordmark is the right call.

### Iconography

**Lucide React** as the icon library. Line-based, single-weight, geometric — the right category (brief §6.4).

- Default stroke: 1.5px
- Default size: 16px inline, 20px in buttons, 24px in standalone contexts
- Colour: `text-ink-600` default, `text-ink-900` for emphasis, accent for active states

**Reject patterns:**
- No filled icons unless they're status indicators (checkmark in a circle is fine)
- No coloured/illustrated icons
- No emoji as UI (use real icons)

### Imagery

Per brief §6: **abstract structural only**, no energy iconography.

For the prototype:
- Project cards: do not use stock photos of solar arrays. Use a generated abstract pattern based on project metadata (a subtle gradient mesh tied to project type, or a procedural lattice pattern).
- Empty states: simple line illustration in `ink-300` on `ink-50`, no characters.
- Avatars: initials on `ink-100` background, `ink-700` text, never illustrated faces.
- Marketing hero: subtle background pattern (lattice / grid) at very low opacity, or empty.

---

## Component patterns

Build a small set of primitives in `components/ui/` that everything else composes from. **Do not use shadcn/ui as a copy-paste source** (brief calls for fully bespoke) — but the shadcn approach (Radix primitives + styled wrapper components) is sound. Build our own.

### Button

```tsx
// components/ui/button.tsx
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-500/22',
  {
    variants: {
      variant: {
        primary: 'bg-ink-900 text-white hover:bg-ink-800 rounded-md',
        secondary: 'bg-white text-ink-900 border border-ink-200 hover:bg-ink-50 rounded-md',
        accent: 'bg-accent-500 text-white hover:bg-accent-600 rounded-md',
        ghost: 'text-ink-700 hover:bg-ink-50 hover:text-ink-900 rounded-md',
        link: 'text-accent-600 hover:text-accent-700 underline-offset-4 hover:underline',
        danger: 'bg-danger-500 text-white hover:bg-danger-600 rounded-md',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-md',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)
```

**Notes:**
- Primary action is ink-900, **not** accent. The accent is precious — reserve for true emphasis.
- No oversized buttons. No promotional saturation.
- Loading state shows a spinner + disabled, never a separate "loading button" component.

### Input, Select, Textarea

- Border `ink-200`, focus border `accent-500` with ring
- Background `white`, disabled `ink-50`
- Height matching button sizes (32 / 40 / 48)
- Label above, hint below in `ink-500 text-xs`, error below in `danger-500 text-xs`
- Never use placeholder as label

### Card

- Background `white`, border `ink-200`, radius `md`, shadow `xs`
- Heading hierarchy lives inside, no decorative card headers
- Hover state: slight border darken (`ink-300`), no transform/scale

### Table

- No alternating row colours
- Border only at row dividers (`border-ink-100`), no vertical lines
- Header row: `ink-500 text-xs uppercase tracking-widest font-medium`
- Body rows: `text-sm` regular weight
- Sortable headers indicated by chevron, never by colour alone

### Badge

The tier badge needs special attention:

```tsx
<TierBadge tier="gold" /> // small, medium, large variants
```

- Restrained, not medal-iconic
- Coloured background at low saturation, dark text on bronze/silver/platinum, bright text on gold
- Letters "GOLD" in widest tracking, semibold
- Subtle border in the tier colour at 30% alpha

### Empty state

Every list/grid has a designed empty state. Pattern:

```
[16px icon, ink-400]
[heading, text-md semibold, ink-900]
[paragraph, text-sm, ink-600]
[primary action button]
```

Never default placeholder text. Never "No data" alone.

### Loading state

**Skeleton over spinner.** Match the actual layout of what's loading. Pulse animation `animate-pulse` on `ink-100` backgrounds.

Exception: button loading uses a small inline spinner.

### Toast

Sonner. **Used sparingly.** Most feedback is inline. Toasts only for:
- Async actions completing where user has navigated away
- System messages (session about to expire)
- Non-blocking success confirmations after a navigation

Never use toasts to communicate form errors.

---

## Animation

Framer Motion. **Polish is a feature.** But restraint is the brand — animations are deliberate, not decorative.

**Use animation for:**
- Page transitions (subtle fade + slight y translate, 200ms)
- Tier progression celebration (one moment of unexpected delight when a contractor crosses Bronze → Silver, etc.)
- Verification "thinking" state (2–4s shimmer / progress animation)
- Milestone status transitions (subtle bounce on stamp / approval)
- Chat message arrival (slide in from bottom)
- Number counting up on dashboard load (use `useMotionValue` + spring)

**Do not animate:**
- Hover states beyond colour transition
- Scroll-triggered "reveal" animations
- Auto-playing carousels
- Anything that demands attention

**Timing:**
- Fast feedback: 120ms
- State transitions: 200–250ms
- Celebration moments: 500–800ms
- Easing: `[0.16, 1, 0.3, 1]` (ease-out-expo) for most things

---

## Layout patterns

### Page shell (authenticated)

```
┌────────────────────────────────────────────────────────┐
│ Sidebar  │  Topbar (role switcher, search, AI, profile)│
│          ├──────────────────────────────────────────────┤
│  Nav     │                                              │
│  Items   │   Page content                               │
│          │                                              │
│  Tier    │                                              │
│  Wallet  │                                              │
└──────────┴──────────────────────────────────────────────┘
```

- Sidebar: 240px desktop, collapsible to 64px (icon-only), hidden on mobile
- Topbar: 56px, sticky
- Content area: `max-w-7xl` centred, `px-6` on desktop, `px-4` on mobile

### Mobile

- Sidebar becomes a bottom sheet triggered by hamburger
- Topbar persists but compresses
- Cards stack
- Tables become accordion lists below `md` breakpoint

---

## Voice extending into visual (brief §7)

Three rules to hold the line:

**Direct → Generous whitespace.** Don't fill space because it exists. Empty regions are intentional.

**Technical without intimidating → Crisp typographic hierarchy.** Heading 30px not 60px. No drop shadows on text. No three-colour gradient text.

**Confident, not promotional → No urgency cues.**
- No starbursts, badges, "NEW!" ribbons
- No saturated red CTAs
- No blinking elements
- No "TRY IT NOW" — use "Get started" or "Request access"
- No exclamation marks in microcopy

---

## Application examples (brief §8 → prototype reality)

### Landing page

Off-white background. Wordmark "SEE" top-left, small. Hero: single short sentence "the operating system for energy project developers" in `text-4xl` ink-900 semibold. Single CTA below: "Request access". Optional: very subtle background lattice pattern at 4% opacity.

Below the fold: three feature sections, each one card, each restrained. Reference Stripe homepage layout — minimal, confident, no marketing copy density.

### Login page

Off-white. Wordmark centred at top. Form card centred, `max-w-sm`. Below the card: "Demo Users" card with four one-click logins.

### Dashboard

Generous whitespace. Stats row at top (4 numbers, no shadows or backgrounds — just typography). Below: 2-column grid (8/4 split). Left: project pipeline + upcoming events. Right: AI NewsFeed sidebar, AI suggestions, tier progress.

**Tier progress card** is one of the few accent uses on the page — it's the gamification element and deserves visual emphasis.

### Project workspace

Three tabs. Tab content uses `max-w-5xl` even within wide layouts — reading is easier. Milestone tracker is a vertical timeline with hard-gate visualisation (locks open as previous milestones complete).

### SEE.AI chat widget

Persistent bottom-right floating button (accent-500, 48px). On open: a panel slides up from bottom, 380px wide on desktop, full-screen on mobile. Header has "SEE.AI" wordmark-style text, close button. Messages: user right-aligned in `accent-50` bubble, assistant left-aligned in `ink-50` bubble. Input at the bottom with a subtle ring on focus.

Voice: SEE.AI is calm, technical, direct. Never overly familiar. No emoji. The chat surface follows the same restraint as the rest of the brand.

---

## What the brand isn't

A reminder for anyone tempted to deviate, run these checks before shipping a screen:

- [ ] Could this be a Phoenix sub-brand? → If yes, redo.
- [ ] Are there panels, turbines, leaves, sunshine anywhere? → If yes, remove.
- [ ] Does it look like Vanta / Stripe / Linear / Mercury? → If yes, ship.
- [ ] Is the accent doing too much work? → If yes, pull back.
- [ ] Is whitespace generous? → If no, add more.
- [ ] Are there any exclamation marks? → If yes, remove.
- [ ] Any gradient on a primary surface? → If yes, remove.
- [ ] Any green / yellow / orange / sunshine palette? → If yes, replace.
