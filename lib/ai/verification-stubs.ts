/**
 * Deterministic AI verification stubs for the SEE Platform demo.
 *
 * Pure business logic — no external imports. Keyed by milestone name and
 * submission version so the demo narrative is always reproducible.
 *
 * Key story beat: EIA v1 fails (missing engineer stamp + stormwater section),
 * EIA v2 passes after resubmission. All other milestones pass.
 */

export type FindingType = 'verified' | 'warning' | 'missing'

export interface VerificationFinding {
  type: FindingType
  text: string
}

export interface VerificationStubResult {
  status: 'PASS' | 'FAIL'
  confidence: number
  findings: VerificationFinding[]
  recommendation?: string
}

// ---------------------------------------------------------------------------
// Stub map — milestone name → version → result
// ---------------------------------------------------------------------------

type VersionMap = Record<number, VerificationStubResult>
type StubMap = Record<string, VersionMap>

const STUBS: StubMap = {
  'Environmental Impact Assessment': {
    1: {
      status: 'FAIL',
      confidence: 0.87,
      findings: [
        {
          type: 'verified',
          text: 'Scoping report references correct site coordinates (−26.2041° S, 28.0473° E).',
        },
        {
          type: 'verified',
          text: 'Public participation records attached and dated within statutory window.',
        },
        {
          type: 'warning',
          text: 'Biodiversity offset calculation uses 2021 regional factor — 2023 factor recommended.',
        },
        {
          type: 'missing',
          text: 'Professional engineer stamp absent on Section 4 (Stormwater Management Plan).',
        },
        {
          type: 'missing',
          text: 'Stormwater section (§4.3) referenced in ToC but pages are blank in submitted PDF.',
        },
      ],
      recommendation:
        'Resubmit with a wet-ink PE stamp on Section 4 and the completed stormwater runoff calculations (§4.3). Update biodiversity offset factor to 2023 values before final approval.',
    },
    2: {
      status: 'PASS',
      confidence: 0.94,
      findings: [
        {
          type: 'verified',
          text: 'Professional engineer stamp present and valid on all technical sections.',
        },
        {
          type: 'verified',
          text: 'Stormwater Management Plan (§4.3) complete with runoff calculations.',
        },
        {
          type: 'verified',
          text: 'Biodiversity offset calculation updated to 2023 regional factor.',
        },
        {
          type: 'verified',
          text: 'Public participation records attached and dated within statutory window.',
        },
        {
          type: 'warning',
          text: 'Minor: species checklist appendix uses non-standard table format — acceptable for submission.',
        },
      ],
      recommendation: 'Document meets all DEA/NEMA requirements. Approved for admin sign-off.',
    },
  },

  'Site Assessment Report': {
    1: {
      status: 'PASS',
      confidence: 0.93,
      findings: [
        { type: 'verified', text: 'Site coordinates and cadastral references verified against deed.' },
        { type: 'verified', text: 'Shadow analysis methodology compliant with SANS 10400-XA.' },
        { type: 'verified', text: 'Geotechnical borehole log attached and signed.' },
        { type: 'warning', text: 'Soil classification table uses imperial units — metric recommended for future submissions.' },
      ],
    },
  },

  'Structural Engineering Report': {
    1: {
      status: 'PASS',
      confidence: 0.96,
      findings: [
        { type: 'verified', text: 'Roof loading calculations comply with SANS 10160-2.' },
        { type: 'verified', text: 'Mounting system rated for local wind zone (Zone 3, 42 m/s).' },
        { type: 'verified', text: 'Professional engineer stamp and ECSA registration number confirmed.' },
        { type: 'verified', text: 'Panel dead load within design envelope.' },
      ],
    },
  },

  'Grid Connection Application': {
    1: {
      status: 'PASS',
      confidence: 0.91,
      findings: [
        { type: 'verified', text: 'NRS 097-2-1 technical data sheet included for inverter model.' },
        { type: 'verified', text: 'Single-line diagram signed by PR Eng.' },
        { type: 'verified', text: 'Protection relay settings match Eskom NRS 048 requirements.' },
        { type: 'warning', text: 'Utility reference number not yet assigned — expected within 15 business days of lodgement.' },
      ],
    },
  },

  'Financial Close Documentation': {
    1: {
      status: 'PASS',
      confidence: 0.97,
      findings: [
        { type: 'verified', text: 'Signed term sheet from lender attached.' },
        { type: 'verified', text: 'Equity commitment letter dated and countersigned.' },
        { type: 'verified', text: 'Financial model version control log present.' },
        { type: 'verified', text: 'DSCR covenant confirmed at 1.35× — above minimum threshold.' },
      ],
    },
  },

  'Construction Commencement': {
    1: {
      status: 'PASS',
      confidence: 0.89,
      findings: [
        { type: 'verified', text: 'Building permit (BP-2024-04821) attached and valid.' },
        { type: 'verified', text: 'Site safety file submitted to Department of Labour.' },
        { type: 'verified', text: 'Commencement date notice filed with local municipality.' },
        { type: 'warning', text: 'Contractor COID certificate expires in 3 months — renewal recommended before final inspection.' },
      ],
    },
  },

  'Commissioning Certificate': {
    1: {
      status: 'PASS',
      confidence: 0.95,
      findings: [
        { type: 'verified', text: 'CoC of Compliance (electrical) issued by registered electrician.' },
        { type: 'verified', text: 'Grid synchronisation test log signed off by Eskom field engineer.' },
        { type: 'verified', text: 'Performance ratio at commissioning: 0.81 (above 0.78 threshold).' },
        { type: 'verified', text: 'System commissioning date matches PPA commercial operation date.' },
      ],
    },
  },

  'Operational Handover': {
    1: {
      status: 'PASS',
      confidence: 0.92,
      findings: [
        { type: 'verified', text: 'O&M manual (v2.1) handed over and receipt acknowledged by client.' },
        { type: 'verified', text: 'Monitoring system access credentials transferred.' },
        { type: 'verified', text: 'Defects liability period start date confirmed in handover certificate.' },
        { type: 'warning', text: 'Training register shows 2 of 4 client staff completed system training — outstanding sessions to be scheduled.' },
      ],
    },
  },
}

// ---------------------------------------------------------------------------
// Default fallback
// ---------------------------------------------------------------------------

function defaultPass(): VerificationStubResult {
  return {
    status: 'PASS',
    confidence: 0.90,
    findings: [
      { type: 'verified', text: 'Document structure and format validated.' },
      { type: 'verified', text: 'Required signatures and stamps present.' },
      { type: 'verified', text: 'Content references correct project identifiers.' },
    ],
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns a deterministic verification result for a given milestone name and
 * submission version number. Falls back to a generic PASS if no stub exists.
 */
export function generateVerificationResult(
  milestoneName: string,
  version: number,
): VerificationStubResult {
  const versionMap = STUBS[milestoneName]
  if (!versionMap) return defaultPass()

  const result = versionMap[version]
  if (!result) return defaultPass()

  return result
}

// ---------------------------------------------------------------------------
// Animation and cost constants
// ---------------------------------------------------------------------------

export const AI_VERIFICATION_LOG_LINES: string[] = [
  'Parsing document structure…',
  'Extracting key sections…',
  'Cross-referencing milestone requirements…',
  'Validating signatures and stamps…',
  'Checking against regulatory standards…',
  'Generating compliance report…',
]

/** Token cost for AI-assisted verification. */
export const AI_VERIFICATION_COST_TOKENS = 1_000

/** Token cost for expert (human) verification. */
export const EXPERT_VERIFICATION_COST_TOKENS = 10_000
