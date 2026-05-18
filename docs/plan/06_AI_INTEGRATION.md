# 06 — AI Integration

How AI features are implemented in the prototype.

**Two patterns**:
1. **Real Claude API** — for interactive, user-driven AI (SEE.AI Assistant chat).
2. **Stubbed** — for system-surfaced AI (Verification Agent, NewsFeed, Prescriptive Maintenance, Project Valuation, WEG recommendations).

The principle: real AI where the user drives the interaction; stubbed AI where the system surfaces a result. The stubs are designed to look indistinguishable in a demo.

---

## SEE.AI Assistant (real Claude)

The persistent chat widget bottom-right of every authenticated screen.

### UX

- **Trigger:** floating 48px button, accent-500
- **Open state:** panel slides up from bottom, 380px wide on desktop, full-screen on mobile, max-height `80vh`
- **Header:** "SEE.AI" wordmark-style text, current conversation title, close button
- **Body:** message list (user right-aligned in `accent-50`, assistant left-aligned in `ink-50` bubbles); auto-scroll on new message; markdown rendering (`react-markdown` + `remark-gfm`)
- **Input:** textarea + send button at bottom; submit on Enter, newline on Shift+Enter
- **History sidebar** (toggle): list of past conversations, click to switch
- **Loading state:** assistant bubble with shimmering dots while streaming
- **Language selector** (top right of panel): English / Afrikaans / Zulu / Portuguese (passed in system prompt)
- **Voice mode toggle:** scaffolded button (mic icon), disabled — placeholder for future

### Server implementation

**Route:** `POST /api/ai/chat` — streaming response using Anthropic SDK with the `messages.stream()` method.

**Model:** `claude-sonnet-4-20250514` (cost-effective for chat at demo volumes; production-tier latency).

**System prompt builder** (`lib/ai/system-prompt.ts`):

```ts
export function buildSystemPrompt(ctx: ChatContext): string {
  return `You are SEE.AI, the intelligent assistant for the Sustainable Energy Ecosystem (SEE) platform.

You are calm, technical, direct, confident — never promotional. You speak in the same register as Stripe's documentation or Linear's product copy. You never use exclamation marks. You never use emoji. You respect the user's intelligence.

You help renewable energy professionals manage their projects on the SEE platform. You have access to tools to fetch real data about the user's portfolio.

## Current user context
- Name: ${ctx.userName}
- Role: ${ctx.role}
- Company: ${ctx.companyName} (${ctx.companyType})
- Current tier: ${ctx.tier}
- Token balance: ${ctx.tokenBalance}
- Currently viewing: ${ctx.currentPage}
${ctx.currentProjectId ? `- Active project: ${ctx.currentProjectName} (${ctx.currentProjectStage})` : ''}

## Language
Respond in: ${ctx.language || 'English'}

## Capabilities
- Answer questions about the user's projects, milestones, and portfolio
- Suggest next actions based on project state
- Recommend Service Providers from the marketplace
- Help draft client communications, proposals, and portfolio overviews
- Explain platform features and workflows
- Recommend WEG inverters where appropriate (the platform partners with WEG for hardware)

## Constraints
- Use the provided tools to fetch real data rather than guessing
- If you don't have data, say so directly — don't fabricate
- For financial figures, always note they are estimates if not directly retrieved
- Never claim a milestone is complete unless tool data confirms it
- When recommending Service Providers, only recommend from the actual marketplace listings

## Voice
- Direct: get to the answer; no padding
- Technical without intimidating: assume professional fluency, explain only what's needed
- Confident, not promotional: state facts; don't sell
- No exclamation marks anywhere`
}
```

### Tool calls

Six tools exposed to the model. Each is a server function that queries Prisma and returns a structured payload.

```ts
// lib/ai/tools.ts

export const aiTools = [
  {
    name: "get_project_details",
    description: "Get detailed information about one of the user's projects by ID or name.",
    input_schema: {
      type: "object",
      properties: {
        identifier: { type: "string", description: "Project ID or partial name match" }
      },
      required: ["identifier"]
    }
  },
  {
    name: "list_projects_at_risk",
    description: "List projects with overdue milestones, rejected submissions, or alerts.",
    input_schema: { type: "object", properties: {} }
  },
  {
    name: "summarise_milestone_status",
    description: "Summarise the milestone status across all the user's active projects.",
    input_schema: {
      type: "object",
      properties: {
        stageFilter: {
          type: "string",
          enum: ["DEVELOPMENT", "FINANCING", "CONSTRUCTION", "COMMISSIONING", "OPERATIONAL"]
        }
      }
    }
  },
  {
    name: "recommend_service_provider",
    description: "Recommend Service Providers from the marketplace for a given category and project.",
    input_schema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["STRUCTURAL_CIVILS", "ENGINEERING", "LEGAL", "LOGISTICS_PLANT_HIRE", "FINANCE_INSURANCE"]
        },
        province: { type: "string", description: "South African province (optional)" }
      },
      required: ["category"]
    }
  },
  {
    name: "generate_company_profile_draft",
    description: "Generate a draft of the company's portfolio overview text suitable for sending to a new client.",
    input_schema: { type: "object", properties: {} }
  },
  {
    name: "list_license_upsell_opportunities",
    description: "List operational sites where the contractor could sell or upgrade O&M licenses to their clients, with estimated commission. Use this to surface revenue opportunities for the EPC.",
    input_schema: { type: "object", properties: {} }
  }
]
```

Tool execution happens server-side in the streaming loop; results are fed back into the conversation as `tool_result` blocks, then the model continues its response.

### Persistence

Every user message and assistant response is saved to `AiConversation` and `AiMessage`. The chat panel's history sidebar lists these by `updatedAt desc`. Each conversation has a `title` auto-generated from the first user message (truncated to ~50 chars).

### Multi-language

Claude handles this natively. The `language` field in the system prompt selects the response language. The UI strings remain English; only Claude's output adapts. Selector saves preference per user.

### Rate limiting

For the demo, no rate limiting needed. For production handoff: 60 messages/user/hour using Upstash Redis or similar. Document this in the README, not built in M10.

### Cost

Sonnet at typical chat volumes is negligible. Budget assumption: ~$5–10/month for active demo usage. Cap with `max_tokens: 1024` per response.

---

## Stubbed AI features

These look like AI in the UI but are deterministic server-side responses. They're designed to be **demo-bulletproof** — no API outages, no surprising outputs, predictable timing for narration.

### AI Verification Agent

The flagship Phase 2 differentiator. When a contractor uploads a milestone artefact and clicks "Verify with AI (1,000 tokens):"

**UX flow:**

1. Confirmation modal: "AI Verification will analyse your submission against milestone requirements. Cost: 1,000 tokens."
2. On confirm: full-screen overlay with realistic "analysing" animation:
   - Shimmering progress bar
   - Log lines appearing one at a time (1s each):
     - "Parsing document structure..."
     - "Extracting key sections..."
     - "Cross-referencing milestone requirements..."
     - "Validating signatures and stamps..."
     - "Checking against regulatory standards..."
     - "Generating compliance report..."
   - Total duration: 6–8 seconds (slowed slightly in Demo Mode for narration)
3. Result reveal: animated entry of the verification card
   - Headline status: PASS / FAIL with prominent icon
   - Confidence score: e.g. "94% confident — High Assurance"
   - Findings list: bullet points of what was checked
   - Recommendations if FAIL
   - "Add to milestone record" button

**Server implementation** (`/api/ai/verify`):

```ts
// lib/ai/verification-stubs.ts
export function generateVerificationResult(milestone: Milestone, submission: MilestoneSubmission) {
  // Deterministic based on milestone name + submission version
  // Seeded so the same submission always returns the same result for demo consistency

  const stubs = {
    "EIA Report": {
      v1: { status: "FAIL", confidence: 0.87, findings: [...], reasons: [...] },
      v2: { status: "PASS", confidence: 0.94, findings: [...] }
    },
    "Structural Engineering Assessment": {
      v1: { status: "PASS", confidence: 0.96, findings: [...] }
    },
    // ... per milestone template item
  }

  return stubs[milestone.name]?.[`v${submission.version}`] ?? defaultPass()
}
```

This means **Project Alpha's EIA story (rejected then resubmitted)** is consistent every time. Versions 1 of every milestone in the canonical seed return PASS or FAIL deterministically, matching the seed's narrative.

**Findings format:** Each finding is structured data that renders as a list with icons:
- `verified` (checkmark)
- `warning` (amber icon)
- `missing` (red icon)

Example PASS findings for an EIA Report:
- ✅ Document is signed and stamped by registered EAP
- ✅ Public participation period documented (45 days, exceeds 30-day minimum)
- ✅ Site-specific environmental factors addressed
- ✅ Mitigation measures align with NEMA Section 24
- ⚠️ Note: storm water management plan referenced but not attached — recommend cross-referencing in submission

Example FAIL findings:
- ❌ Engineer's stamp missing from page 12 (Structural Schedule)
- ✅ Calculations methodology is sound
- ⚠️ Load calculations don't reference SANS 10160 explicitly
- ❌ Foundation design assumes soil bearing capacity that contradicts geotechnical report

This level of detail makes the verification feel real even though it's canned.

### 3rd Party Expert Verification

Real workflow (not AI), but admin acts as expert for the demo.

**UX flow:**
1. Contractor confirms 10,000 tokens
2. Submission moves to expert queue
3. Admin role (or designated "expert user") opens the queue, reviews submission
4. Submits a form with: quality rating (RED/AMBER/GREEN/GOLD), structured findings, notes
5. Contractor gets notification and result appears on the milestone

No AI involved — this is the human-verified path that contrasts with the AI Verification Agent.

### NewsFeed (curated)

A static array of news items in the seed (see `05_SEED_DATA.md`). The dashboard sidebar pulls these via TanStack Query from `/api/news?limit=8`, ordered by `publishedAt desc`. Items rotate visually every 5 minutes (refresh interval) for live-demo realism.

No real news API integration.

### Prescriptive Maintenance alerts

Gated to **AI License tier** O&M licenses only. Projects with Basic or Premium tier show production data but no prescriptive alerts. Projects with no active license show the paywall (see `09_PAYMENTS_AND_LICENSING.md`).

Pre-canned alerts tied to specific demo projects with AI License active. For Kruger Farm (Project #4):

```ts
const stubAlerts = [
  {
    site: "Kruger Farm",
    severity: "warning",
    type: "performance_decline",
    title: "Inverter 2 efficiency trending down",
    description: "Inverter 2 has lost 3% efficiency over the last 10 days. Pattern matches dust accumulation. Recommend cleaning within 7 days.",
    suggestedAction: { type: "schedule_maintenance", maintenanceType: "CLEANING", suggestedDate: addDays(new Date(), 5) }
  },
  {
    site: "Kruger Farm",
    severity: "info",
    type: "weather_forecast",
    title: "Bad weather forecast for tomorrow",
    description: "Severe thunderstorm forecast for Mpumalanga 14:00–18:00 tomorrow. Recommend preserving battery state of charge in anticipation of grid instability.",
    suggestedAction: { type: "battery_preserve", duration_hours: 6 }
  }
]
```

Rendered on the contractor dashboard's "Plant Notifications" widget and the End-Client's plant dashboard.

### Project Valuation ("Sell My Project")

For PPA/Lease projects on the EPC side, and outright projects on the Client side.

**UX flow:**
1. Click "Sell My Project" on a project workspace
2. Modal: "AI is valuing your project..." 4s shimmer animation
3. Result panel:
   - Estimated value range: "R 4.2M – R 5.1M"
   - Key drivers: location, contract duration remaining, performance history, deal structure
   - Comparable transactions (mocked): "3 similar PPA projects sold in last 12 months — median R 4.8M"
   - "List for sale" CTA

**Server:** deterministic valuation based on project size × deal structure × performance × age. See `lib/ai/valuation-stub.ts`.

### WEG product recommendations

On the hardware browse page and during cart, WEG inverter listings get a small accent badge "Recommended" alongside a tooltip: "WEG inverters match your project requirements and qualify for partnership pricing."

The "match" is computed deterministically: any active Solar PV project under 200 kW shows WEG SRW7-A-30K as recommended; 200–500 kW shows the 100K model.

### Proposal generation

"Generate Proposal" button on a project workspace → 3s animation → mocked PDF download.

No actual document generation. The mocked download UX (button → "Generating..." → toast "Downloaded") is sufficient for the prototype.

---

## API endpoints

```
POST   /api/ai/chat                     Real Claude streaming (SEE.AI)
GET    /api/ai/conversations            List user's conversations
GET    /api/ai/conversations/[id]       Get conversation history
DELETE /api/ai/conversations/[id]       Delete a conversation

POST   /api/ai/verify                   Stubbed verification (deterministic)
POST   /api/ai/valuate                  Stubbed project valuation
GET    /api/ai/alerts                   Stubbed prescriptive alerts for user's portfolio
GET    /api/ai/recommendations          Stubbed WEG hardware recommendations
GET    /api/news                        Curated news items
```

All return JSON. AI chat is the only streaming endpoint.

---

## Env configuration

```
ANTHROPIC_API_KEY=sk-ant-...           # required for SEE.AI Assistant
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

If `ANTHROPIC_API_KEY` is missing, the chat widget shows a graceful degraded state: "SEE.AI is currently offline" with a tooltip explaining the key needs to be set. The rest of the prototype works fine without it.

---

## Demo failure modes

Things that might break the AI experience live:

| Issue | Mitigation |
|---|---|
| Anthropic API down | Chat widget shows "SEE.AI temporarily unavailable" with retry; rest of demo unaffected |
| Slow API response | 30s timeout, friendly message |
| Tool call errors | Fallback to text-only response without tool data |
| Long conversation context | Conversation summarisation after 20 messages |
| User asks something out of scope | System prompt instructs to redirect to platform features |

**Pre-demo checklist:**
- ANTHROPIC_API_KEY set in Vercel
- Test conversation completes successfully on demo URL
- Tools return expected data for seeded demo user

---

## Future (not in prototype)

For the production build (referenced in proposal Phase 6):

- Claude tool-use with retrieval (Vector via APEX) — currently stubbed Prisma queries become embedded-knowledge retrieval
- Voice mode (mic input → Whisper → Claude → TTS)
- Real document analysis for AI Verification Agent (Claude vision + structured outputs)
- Real prescriptive maintenance from time-series ML models
- Real project valuation from comparable transactions DB

The prototype shows the *shape* of all of this without building the production substrate.
