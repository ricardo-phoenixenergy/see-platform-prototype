import Link from 'next/link'
import { Wordmark } from '@/components/brand/wordmark'
import {
  Layers, CheckCircle, ShieldCheck, Wrench, Activity, MessageSquare,
  ShoppingBag, Building2, Users, ArrowRight, Globe, Minus,
} from 'lucide-react'

// ── Plan feature lists ────────────────────────────────────────────────────────

const STARTER_FEATURES = [
  'Up to 3 active projects',
  'Full milestone lifecycle tracking',
  'Document management & submission',
  'Communications workspace per project',
  'Basic milestone verification',
  'Client & site management',
]

const PROFESSIONAL_FEATURES = [
  'Unlimited active projects',
  'Everything in Starter',
  'Hardware procurement marketplace',
  'Service marketplace with escrow payments',
  'O&M monitoring dashboards',
  'Client portal management',
  'Tier rewards & token economy',
  'Priority support',
]

const ENTERPRISE_FEATURES = [
  'Everything in Professional',
  'SEE.AI assistant & AI-assisted verification',
  'AI-powered prescriptive maintenance',
  'API access & scheduled data exports',
  'Dedicated account manager',
  'White-label client portal',
  'Enterprise multi-site dashboards',
  'Custom integrations',
]

const SP_FEATURES = [
  'Browse & bid on RFQs in your category',
  'Job card & deliverable management',
  'Escrow-protected payment flow',
  'Company profile & client reviews',
  'Service area targeting',
]

// ── Sub-components ────────────────────────────────────────────────────────────

function FeatureItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <CheckCircle className="h-4 w-4 text-ink-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
      <span className="text-sm text-ink-600">{text}</span>
    </li>
  )
}

function PlanCard({
  badge, title, subtitle, features, cta, highlight = false,
}: {
  badge?: string
  title: string
  subtitle: string
  features: string[]
  cta: string
  highlight?: boolean
}) {
  return (
    <div className={`relative flex flex-col rounded-xl border p-8 ${
      highlight
        ? 'border-ink-900 bg-white shadow-lg'
        : 'border-ink-200 bg-white'
    }`}>
      {badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-ink-900 px-3 py-0.5 text-[11px] font-semibold text-white tracking-wide">
          {badge}
        </span>
      )}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-400 mb-1">{title}</p>
        <p className="text-sm text-ink-600 leading-snug">{subtitle}</p>
      </div>
      <ul className="space-y-3 flex-1 mb-8">
        {features.map(f => <FeatureItem key={f} text={f} />)}
      </ul>
      <Link
        href="/login"
        className={`inline-flex h-10 items-center justify-center rounded-md text-sm font-medium transition-colors ${
          highlight
            ? 'bg-ink-900 text-white hover:bg-ink-800'
            : 'border border-ink-200 text-ink-900 hover:bg-ink-50'
        }`}
      >
        {cta}
      </Link>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="relative bg-white text-ink-900 overflow-x-hidden">

      {/* Dot lattice — hero only */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-[100vh] opacity-[0.035]"
        style={{
          backgroundImage: 'radial-gradient(circle, #14161A 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* ── Header ── */}
      <header className="relative z-20 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <Wordmark size="md" />
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-ink-600 hover:text-ink-900 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="inline-flex h-9 items-center rounded-md bg-ink-900 px-4 text-sm font-medium text-white hover:bg-ink-800 transition-colors"
          >
            Request access
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-28 max-w-4xl mx-auto">
        <p className="mb-4 text-xs font-semibold tracking-widest uppercase text-ink-400">
          SEE Platform
        </p>
        <h1 className="mb-6 text-5xl font-semibold tracking-tight text-ink-900 leading-[1.12]">
          The operating system<br />for energy project developers.
        </h1>
        <p className="mb-10 max-w-xl text-lg text-ink-500 leading-relaxed">
          From site assessment to long-term O&amp;M — one platform managing every milestone,
          stakeholder, and payment across the full lifecycle of a C&amp;I renewable energy project.
        </p>
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <Link
            href="/login"
            className="inline-flex h-12 items-center gap-2 rounded-md bg-ink-900 px-6 text-base font-medium text-white hover:bg-ink-800 transition-colors"
          >
            Request access
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center rounded-md border border-ink-200 px-6 text-base font-medium text-ink-900 hover:bg-ink-50 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div className="border-y border-ink-100 bg-ink-25 py-6 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 gap-6 sm:grid-cols-4 text-center">
          {[
            { value: '240+', label: 'Projects managed' },
            { value: '18 MW', label: 'Installed capacity tracked' },
            { value: '160+', label: 'Milestones verified' },
            { value: '48 hrs', label: 'Average verification turnaround' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-2xl font-semibold text-ink-900 tracking-tight">{s.value}</p>
              <p className="text-xs text-ink-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Who it's for ── */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold tracking-widest uppercase text-ink-400 mb-3">Built for the whole ecosystem</p>
          <h2 className="text-3xl font-semibold tracking-tight text-ink-900">One platform. Three roles.</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            {
              icon: Building2,
              role: 'EPC Contractor',
              headline: 'Manage every project from development to handover.',
              description:
                'Track milestones, manage documents, procure hardware, subcontract services, and give your clients a branded monitoring experience — all from a single dashboard.',
            },
            {
              icon: Wrench,
              role: 'Service Provider',
              headline: 'Find work. Deliver. Get paid securely.',
              description:
                'Discover RFQs in your service category, submit competitive bids, manage job cards and deliverables, and receive payment through a platform-backed escrow system.',
            },
            {
              icon: Activity,
              role: 'End Client',
              headline: 'Your energy asset, always visible.',
              description:
                'Access live plant performance dashboards, O&M schedules, project documents, and alerts — from a clean client portal managed by your EPC.',
            },
          ].map(({ icon: Icon, role, headline, description }) => (
            <div key={role} className="rounded-xl border border-ink-200 p-8 flex flex-col gap-4">
              <div className="h-10 w-10 rounded-lg bg-ink-100 flex items-center justify-center">
                <Icon className="h-5 w-5 text-ink-600" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-ink-400 mb-1">{role}</p>
                <p className="text-base font-semibold text-ink-900 leading-snug mb-2">{headline}</p>
                <p className="text-sm text-ink-500 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-ink-25 border-y border-ink-100 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold tracking-widest uppercase text-ink-400 mb-3">Platform capabilities</p>
            <h2 className="text-3xl font-semibold tracking-tight text-ink-900">Everything a project needs to close.</h2>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Layers,
                title: 'Milestone lifecycle management',
                description:
                  'Auto-gated milestones from Development through Commissioning to Operational. Each phase has defined document requirements and a structured verification path before progression.',
              },
              {
                icon: ShieldCheck,
                title: 'Structured milestone verification',
                description:
                  'Submissions go through a two-step review — platform-assisted pre-check followed by admin sign-off. Enterprise plans add AI-assisted analysis to accelerate turnaround.',
              },
              {
                icon: ShoppingBag,
                title: 'Hardware procurement marketplace',
                description:
                  'Browse verified suppliers, compare specifications, and purchase equipment directly. Tier discounts and token rewards reduce net cost for high-volume contractors.',
              },
              {
                icon: Users,
                title: 'Service marketplace with escrow',
                description:
                  'Post RFQs, receive bids from qualified service providers, and award contracts. Payment is held in escrow and released only when deliverables are approved.',
              },
              {
                icon: Activity,
                title: 'O&M monitoring & dashboards',
                description:
                  'Live production, battery state-of-charge, consumption, and irradiance charts for every operational site. Clients access their own portal with a clean, branded view.',
              },
              {
                icon: MessageSquare,
                title: 'Project communications workspace',
                description:
                  'Every project gets a structured comms workspace with default channels — General, Site Updates, Client, and Admin — keeping all stakeholders aligned in one place.',
              },
            ].map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-5">
                <div className="h-9 w-9 rounded-lg bg-white border border-ink-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-ink-600" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900 mb-1">{title}</p>
                  <p className="text-sm text-ink-500 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tier & Token Rewards ── */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold tracking-widest uppercase text-ink-400 mb-3">SEE Token Rewards</p>
          <h2 className="text-3xl font-semibold tracking-tight text-ink-900">Get rewarded for quality projects.</h2>
          <p className="mt-3 text-base text-ink-500 max-w-2xl mx-auto leading-relaxed">
            Every verified milestone earns SEE Tokens. Your tier multiplies every token earned, and
            tokens redeem against hardware and services — up to 10% off every transaction.
          </p>
        </div>

        {/* Token earn mechanics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-4">
          {([
            { tokens: '100 tokens', event: 'per AI-assisted milestone review', detail: 'Platform pre-check pass' },
            { tokens: '300 tokens', event: 'per expert verification sign-off', detail: 'Admin approval milestone' },
            { tokens: '1,000 tokens', event: 'per operational project', detail: 'Full project lifecycle complete' },
          ] as const).map(item => (
            <div key={item.event} className="rounded-xl border border-ink-200 bg-white p-6">
              <p className="text-xl font-semibold text-ink-900 mb-1">{item.tokens}</p>
              <p className="text-sm text-ink-700">{item.event}</p>
              <p className="text-xs text-ink-400 mt-0.5">{item.detail}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-ink-400 text-center mb-16">
          10 tokens = R1 in spending power &nbsp;·&nbsp; multiplied by your tier &nbsp;·&nbsp; capped at 10% per transaction
        </p>

        {/* Tier cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
          {([
            {
              name: 'Bronze',
              color: '#A56A3E',
              threshold: 'Starting tier',
              stats: [
                { value: '2%', label: 'Marketplace discount' },
                { value: '10%', label: 'O&M commission' },
                { value: '1×', label: 'Token multiplier' },
              ],
              unlocks: ['Full platform access', 'Marketplace bidding', 'Token rewards begin'],
            },
            {
              name: 'Silver',
              color: '#8B95A0',
              threshold: '5 projects · 1,000 kW installed',
              stats: [
                { value: '5%', label: 'Marketplace discount' },
                { value: '20%', label: 'O&M commission' },
                { value: '1.5×', label: 'Token multiplier' },
              ],
              unlocks: ['Project leads from platform', 'Elevated token earnings'],
            },
            {
              name: 'Gold',
              color: '#C9A03E',
              threshold: '25 projects · 5,000 kW installed',
              stats: [
                { value: '8%', label: 'Marketplace discount' },
                { value: '30%', label: 'O&M commission' },
                { value: '2×', label: 'Token multiplier' },
              ],
              unlocks: ['Access to networking events', 'Priority verification queue'],
            },
            {
              name: 'Platinum',
              color: '#6E7A8A',
              threshold: '40 projects · 10,000 kW installed',
              stats: [
                { value: '10%', label: 'Marketplace discount' },
                { value: '40%', label: 'O&M commission' },
                { value: '3×', label: 'Token multiplier' },
              ],
              unlocks: ['SEE Certified badge', 'Dedicated premium support'],
            },
          ] as const).map((tier) => (
            <div key={tier.name} className="rounded-xl border border-ink-200 bg-white p-6 flex flex-col gap-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: tier.color }} />
                  <p className="text-sm font-semibold text-ink-900">{tier.name}</p>
                </div>
                <p className="text-xs text-ink-400">{tier.threshold}</p>
              </div>

              <div className="space-y-2.5">
                {tier.stats.map(s => (
                  <div key={s.label} className="flex items-baseline justify-between">
                    <p className="text-xs text-ink-400">{s.label}</p>
                    <p className="text-sm font-semibold text-ink-900">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-ink-100 space-y-2">
                {tier.unlocks.map(u => (
                  <div key={u} className="flex items-start gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-ink-300 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <p className="text-xs text-ink-500">{u}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold tracking-widest uppercase text-ink-400 mb-3">Plans</p>
          <h2 className="text-3xl font-semibold tracking-tight text-ink-900">Choose what fits your scale.</h2>
          <p className="mt-3 text-base text-ink-500 max-w-lg mx-auto">
            All contractor plans include the full project workflow. Upgrade as your portfolio grows.
          </p>
        </div>

        {/* Contractor plans */}
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-400 mb-6">For EPC contractors</p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <PlanCard
              title="Starter"
              subtitle="Get started at no cost. Build your first projects and learn the platform."
              features={STARTER_FEATURES}
              cta="Get started free"
            />
            <PlanCard
              badge="Most popular"
              title="Professional"
              subtitle="For active EPCs managing a growing portfolio. No AI features."
              features={PROFESSIONAL_FEATURES}
              cta="Request access"
              highlight
            />
            <PlanCard
              title="Enterprise"
              subtitle="For established developers. Includes AI, API access, and a dedicated account manager."
              features={ENTERPRISE_FEATURES}
              cta="Contact us"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-ink-100 my-10" />

        {/* SP plan */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-400 mb-6">For service providers</p>
          <div className="max-w-sm">
            <PlanCard
              title="Service Provider"
              subtitle="For specialist subcontractors looking to work within the SEE ecosystem."
              features={SP_FEATURES}
              cta="Join as a service provider"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-ink-100 my-10" />

        {/* End client / O&M license */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-400 mb-2">
                For building owners &amp; facility managers
              </p>
              <h3 className="text-xl font-semibold text-ink-900">O&amp;M Dashboard &amp; Monitoring License</h3>
              <p className="text-sm text-ink-500 mt-1.5 max-w-xl leading-relaxed">
                Your EPC manages your project on SEE. As the site owner, you can integrate your
                plant into the SEE platform for real-time monitoring, O&amp;M tracking, and
                performance reporting. Access is provisioned through your contractor.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-ink-900 px-5 text-sm font-medium text-white hover:bg-ink-800 transition-colors flex-shrink-0"
            >
              Contact Sales
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>

          <div className="rounded-xl border border-ink-200 overflow-hidden">
            {/* Tier header row */}
            <div className="grid grid-cols-5 border-b border-ink-100">
              <div className="p-5" />
              {[
                { name: 'Basic', sub: 'Core visibility' },
                { name: 'Standard', sub: 'Full dashboard' },
                { name: 'Premium', sub: 'Reports & exports' },
                { name: 'AI', sub: 'Prescriptive maintenance' },
              ].map((tier, i) => (
                <div key={tier.name} className={`p-5 text-center border-l border-ink-100 ${i === 1 ? 'bg-ink-25' : ''}`}>
                  <p className="text-sm font-semibold text-ink-900">{tier.name}</p>
                  <p className="text-xs text-ink-400 mt-0.5">{tier.sub}</p>
                </div>
              ))}
            </div>

            {/* Feature rows */}
            {[
              { label: 'Plant performance dashboard',        basic: true,  standard: true,  premium: true,  ai: true  },
              { label: 'Live production & consumption data', basic: true,  standard: true,  premium: true,  ai: true  },
              { label: 'Document repository',               basic: true,  standard: true,  premium: true,  ai: true  },
              { label: 'O&M event log',                     basic: true,  standard: true,  premium: true,  ai: true  },
              { label: 'Project communications access',     basic: true,  standard: true,  premium: true,  ai: true  },
              { label: 'Battery SoC & irradiance tracking', basic: false, standard: true,  premium: true,  ai: true  },
              { label: 'O&M scheduling & maintenance log',  basic: false, standard: true,  premium: true,  ai: true  },
              { label: 'Performance benchmarking & reports',basic: false, standard: false, premium: true,  ai: true  },
              { label: 'Scheduled data exports',            basic: false, standard: false, premium: true,  ai: true  },
              { label: 'SEE.AI prescriptive maintenance',   basic: false, standard: false, premium: false, ai: true  },
              { label: 'Automated anomaly alerts',          basic: false, standard: false, premium: false, ai: true  },
            ].map((row, ri) => (
              <div key={row.label} className={`grid grid-cols-5 border-b border-ink-100 last:border-b-0 ${ri % 2 === 1 ? 'bg-ink-25/50' : ''}`}>
                <div className="p-4 px-5">
                  <p className="text-sm text-ink-700">{row.label}</p>
                </div>
                {(['basic', 'standard', 'premium', 'ai'] as const).map((tier, i) => (
                  <div key={tier} className={`p-4 flex items-center justify-center border-l border-ink-100 ${i === 1 ? 'bg-ink-25/60' : ''}`}>
                    {row[tier]
                      ? <CheckCircle className="h-4 w-4 text-ink-600" strokeWidth={2} />
                      : <Minus className="h-4 w-4 text-ink-200" strokeWidth={2} />
                    }
                  </div>
                ))}
              </div>
            ))}

            {/* CTA row */}
            <div className="grid grid-cols-5 bg-ink-25 border-t border-ink-200">
              <div className="p-5">
                <p className="text-xs text-ink-400">Pricing on request — contact your EPC or our sales team.</p>
              </div>
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`p-4 flex items-center justify-center border-l border-ink-100 ${i === 1 ? 'bg-ink-25' : ''}`}>
                  <Link
                    href="/login"
                    className="text-xs font-medium text-ink-600 hover:text-ink-900 transition-colors"
                  >
                    Contact Sales
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-ink-900 py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <Globe className="h-8 w-8 text-ink-400 mx-auto mb-6" strokeWidth={1.5} />
          <h2 className="text-3xl font-semibold text-white tracking-tight mb-4">
            Ready to streamline your project pipeline?
          </h2>
          <p className="text-base text-ink-400 mb-8 leading-relaxed">
            Join contractors already managing their renewable energy portfolios on the SEE Platform.
          </p>
          <div className="flex items-center gap-3 justify-center flex-wrap">
            <Link
              href="/login"
              className="inline-flex h-12 items-center gap-2 rounded-md bg-white px-6 text-base font-medium text-ink-900 hover:bg-ink-100 transition-colors"
            >
              Request access
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center rounded-md border border-ink-700 px-6 text-base font-medium text-ink-300 hover:border-ink-600 hover:text-white transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-8 py-6 text-xs text-ink-400 text-center border-t border-ink-100">
        © 2026 SEE Platform. All rights reserved.
      </footer>
    </div>
  )
}
