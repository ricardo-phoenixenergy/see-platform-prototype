# 03 — Data Model

Complete Prisma schema and entity reasoning. This is the source of truth for the database. Other files reference these entities by name.

---

## Design principles

1. **Reflect the real platform.** Even where a feature is mocked, the schema represents what the production system would store. The prototype becomes a meaningful Phase 1 head-start.
2. **Soft deletes** via `deletedAt` for user-facing entities. Hard delete only for genuine throwaways.
3. **Auditability.** All major entities have `createdAt`, `updatedAt`. Milestones, submissions, and verifications track who acted and when.
4. **Multi-tenancy seam.** A `Company` is the tenant boundary. Even though we're single-tenant for the demo, structure data as if multi-tenant from day one.
5. **JSON where structure is fluid, columns where structure is stable.** Milestone artefact metadata is JSONB. Project type is an enum.

---

## Entity overview

```
User
 ├─ Memberships (User × Company × Role)
 ├─ Sessions, Accounts (NextAuth)
 ├─ ChannelMemberships (project comms — see 08)
 └─ Messages, MessageReactions (project comms — see 08)

Company
 ├─ KycSubmission
 ├─ ComplianceDocuments[]
 ├─ Projects[]              (if Contractor)
 ├─ ServiceProviderProfile (if Service Provider)
 ├─ WalletBalance
 ├─ TokenTransactions[]
 ├─ TierStatus
 └─ Reviews[]

Project
 ├─ Milestones[]            (instantiated from a MilestoneTemplate)
 ├─ Site
 ├─ ClientCompany
 ├─ Documents[]
 ├─ OmLicenses[]            (EPC + Client view licenses — see 09)
 ├─ EnterpriseScopes[]      (if covered by an Enterprise license — see 09)
 ├─ OmReadings[]            (telemetry)
 └─ ProjectWorkspace        (comms workspace — see 08)

ProjectWorkspace (see 08_COMMUNICATIONS.md for full schema)
 └─ Channels[]
      ├─ ChannelMemberships[]
      └─ Messages[]
           ├─ MessageReactions[]
           └─ replies[] (self-relation)

MilestoneTemplate
 ├─ MilestoneTemplateItems[]  (definition of what's needed)
 └─ versioned (Snapshot on project instantiation)

Milestone (instance)
 ├─ Submissions[]
 ├─ Verifications[]
 ├─ RfqLink (optional — "Get Service" bridge)
 ├─ Channel (the milestone's auto-created thread — see 08)
 └─ status, dueDate, completedAt

Rfq
 ├─ Bids[]
 ├─ linked Milestone
 └─ converts to JobCard on accept

JobCard
 ├─ ServiceProvider company
 ├─ Contractor company
 ├─ Deliverables[]
 ├─ Chat thread
 └─ escrow status

HardwareListing
 ├─ Supplier
 ├─ Category
 └─ Orders[]

Order (hardware)
 ├─ items[]
 ├─ payment (PayFast mock)
 └─ tokenAllocation

NewsItem (curated content)
AiConversation (SEE.AI chat history)
AiMessage
Notification

AuditLog
```

---

## Prisma schema

This is the complete schema. Generate the Prisma client, run `prisma migrate dev --name init`, then run `prisma db seed`.

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// =========================================================================
// AUTH (NextAuth tables)
// =========================================================================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  passwordHash  String?
  image         String?

  memberships   Membership[]
  sessions      Session[]
  accounts      Account[]
  aiConversations AiConversation[]
  notifications Notification[]
  auditLogs     AuditLog[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

// =========================================================================
// COMPANIES & MEMBERSHIPS
// =========================================================================

model Company {
  id              String      @id @default(cuid())
  name            String
  type            CompanyType
  registrationNo  String?     // CIPC number
  vatNo           String?
  beeeLevel       Int?
  logoUrl         String?

  // Profile
  about           String?
  websiteUrl      String?
  phone           String?
  email           String?

  // Banking (mocked)
  bankName        String?
  bankAccountLast4 String?

  memberships     Membership[]
  kycSubmissions  KycSubmission[]
  complianceDocs  ComplianceDocument[]

  // Contractor-side
  projects        Project[]                @relation("ContractorProjects")
  tierStatus      TierStatus?
  walletBalance   WalletBalance?
  tokenTransactions TokenTransaction[]

  // Service Provider-side
  serviceProviderProfile ServiceProviderProfile?
  bidsSubmitted   Bid[]
  jobCardsAsProvider JobCard[]             @relation("JobCardProvider")
  reviewsReceived Review[]                 @relation("ReviewedCompany")

  // End-Client-side
  ownedProjectsAsClient Project[]          @relation("ClientProjects")

  hardwareOrders  Order[]
  notifications   Notification[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?
}

enum CompanyType {
  CONTRACTOR
  SERVICE_PROVIDER
  END_CLIENT
  PLATFORM_ADMIN
}

model Membership {
  id        String   @id @default(cuid())
  userId    String
  companyId String
  role      Role
  isOwner   Boolean  @default(false)

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  company   Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@unique([userId, companyId])
  @@index([companyId])
}

enum Role {
  CONTRACTOR
  SERVICE_PROVIDER
  CLIENT
  ADMIN
}

// =========================================================================
// KYC & COMPLIANCE
// =========================================================================

model KycSubmission {
  id            String       @id @default(cuid())
  companyId     String
  cipcDocUrl    String?
  vatDocUrl     String?
  directorIdUrl String?
  status        KycStatus    @default(PENDING)
  rejectionReason String?
  reviewedBy    String?      // userId of admin
  reviewedAt    DateTime?

  company       Company      @relation(fields: [companyId], references: [id])

  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}

enum KycStatus {
  PENDING
  APPROVED
  REJECTED
  REQUEST_INFO
}

model ComplianceDocument {
  id            String   @id @default(cuid())
  companyId     String
  category      String   // "BEEE Certificate", "Tax Clearance", "PI Insurance", etc.
  documentUrl   String
  expiresAt     DateTime?
  isVerified    Boolean  @default(false)

  company       Company  @relation(fields: [companyId], references: [id])

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

// =========================================================================
// TIER & WALLET
// =========================================================================

model TierStatus {
  id                  String   @id @default(cuid())
  companyId           String   @unique
  tier                Tier     @default(BRONZE)
  compliantProjectCount Int    @default(0)
  pointsToNextTier    Int      @default(0)

  company             Company  @relation(fields: [companyId], references: [id])

  updatedAt           DateTime @updatedAt
}

enum Tier {
  BRONZE
  SILVER
  GOLD
  PLATINUM
}

model WalletBalance {
  id          String   @id @default(cuid())
  companyId   String   @unique
  tokens      Int      @default(0)
  fiatCents   Int      @default(0)  // escrow / pending

  company     Company  @relation(fields: [companyId], references: [id])

  updatedAt   DateTime @updatedAt
}

model TokenTransaction {
  id          String                @id @default(cuid())
  companyId   String
  amount      Int                   // positive = earned, negative = spent
  type        TokenTransactionType
  description String
  metadata    Json?                 // reference to related entity (project, milestone, order)

  company     Company               @relation(fields: [companyId], references: [id])

  createdAt   DateTime              @default(now())

  @@index([companyId, createdAt])
}

enum TokenTransactionType {
  EARN_TUTORIAL
  EARN_PROJECT_CREATE
  EARN_SERVICE_REQUEST
  EARN_EXISTING_PROJECT_UPLOAD
  EARN_CASHBACK
  EARN_TIER_BONUS
  SPEND_AI_VERIFICATION
  SPEND_EXPERT_VERIFICATION
  SPEND_COMPANY_PROFILE_GEN
  SPEND_HARDWARE_DISCOUNT
  ADJUSTMENT
}

// =========================================================================
// PROJECTS
// =========================================================================

model Project {
  id                  String          @id @default(cuid())
  name                String
  contractorCompanyId String
  clientCompanyId     String?         // optional — client may not be on platform yet
  externalClientName  String?         // used when clientCompanyId is null
  siteId              String          @unique

  // Technical classification
  technology          Technology
  gridConnectionStatus GridConnectionStatus
  systemSizeKw        Float
  storageSizeKwh      Float?

  // Commercial
  dealStructure       DealStructure
  contractValueCents  Int?
  ppaTariffCents      Int?            // if PPA

  // Workflow
  stage               ProjectStage    @default(DEVELOPMENT)
  templateSnapshot    Json            // snapshot of milestone template at creation
  templateVersion     Int

  // Client motivations
  clientNeeds         String?

  // Computed/cached
  completionPercentage Int            @default(0)

  contractorCompany   Company         @relation("ContractorProjects", fields: [contractorCompanyId], references: [id])
  clientCompany       Company?        @relation("ClientProjects", fields: [clientCompanyId], references: [id])
  site                Site            @relation(fields: [siteId], references: [id])
  milestones          Milestone[]
  documents           ProjectDocument[]
  omContract          OmContract?
  omReadings          OmReading[]
  rfqs                Rfq[]
  saleListing         ProjectSaleListing?

  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt
  completedAt         DateTime?
  deletedAt           DateTime?

  @@index([contractorCompanyId, stage])
  @@index([clientCompanyId])
}

enum Technology {
  SOLAR_PV
  WIND
  BESS          // battery energy storage
  HYBRID
}

enum GridConnectionStatus {
  GRID_TIED
  OFF_GRID
  GRID_TIED_WITH_BACKUP
}

enum DealStructure {
  OUTRIGHT
  PPA
  LEASE
}

enum ProjectStage {
  DEVELOPMENT        // pre-financial-close
  FINANCING
  CONSTRUCTION
  COMMISSIONING
  OPERATIONAL
  DECOMMISSIONED
}

model Site {
  id            String   @id @default(cuid())
  addressLine   String
  city          String
  province      String
  country       String   @default("South Africa")
  latitude      Float?
  longitude     Float?
  irradianceKwhM2Day Float? // location-specific

  project       Project?

  createdAt     DateTime @default(now())
}

model ProjectDocument {
  id          String   @id @default(cuid())
  projectId   String
  category    String
  name        String
  url         String
  uploadedBy  String   // userId
  fileSize    Int

  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  createdAt   DateTime @default(now())
}

// =========================================================================
// MILESTONE TEMPLATES & INSTANCES
// =========================================================================

model MilestoneTemplate {
  id          String                  @id @default(cuid())
  name        String                  // e.g., "Solar C&I < 1MW Outright"
  version     Int                     @default(1)
  isActive    Boolean                 @default(true)

  // Selection rules (consumed by lib/milestone-templates.ts)
  technology    Technology
  minSizeKw     Float?
  maxSizeKw     Float?
  dealStructure DealStructure[]

  items       MilestoneTemplateItem[]

  createdAt   DateTime                @default(now())
  updatedAt   DateTime                @updatedAt
}

model MilestoneTemplateItem {
  id            String   @id @default(cuid())
  templateId    String
  order         Int
  phase         ProjectStage  // which project stage this milestone belongs to
  name          String        // e.g., "EIA Report"
  description   String
  isHardGate    Boolean       @default(true)
  requiredArtefacts Json     // array of { name, allowedTypes }
  estimatedDays Int?

  template      MilestoneTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)

  @@unique([templateId, order])
}

model Milestone {
  id              String          @id @default(cuid())
  projectId       String
  templateItemId  String?         // ref to source item; nullable for ad-hoc
  order           Int
  phase           ProjectStage
  name            String
  description     String
  isHardGate      Boolean
  requiredArtefacts Json

  status          MilestoneStatus @default(LOCKED)
  startedAt       DateTime?
  completedAt     DateTime?
  dueDate         DateTime?

  project         Project         @relation(fields: [projectId], references: [id], onDelete: Cascade)
  submissions     MilestoneSubmission[]
  rfqs            Rfq[]           // a milestone can have multiple "Get Service" requests

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([projectId, order])
}

enum MilestoneStatus {
  LOCKED
  AVAILABLE
  IN_PROGRESS
  SUBMITTED
  UNDER_REVIEW
  ACTION_REQUIRED
  APPROVED
  AUTO_GOLD     // sourced through marketplace, auto-verified
}

model MilestoneSubmission {
  id              String                 @id @default(cuid())
  milestoneId     String
  submittedBy     String                 // userId
  artefacts       Json                   // array of { name, url, fileSize, sha256 }
  notes           String?
  version         Int                    @default(1)

  status          SubmissionStatus       @default(PENDING)
  reviewedBy      String?
  reviewedAt      DateTime?
  feedback        String?
  rejectionAnnotations Json?             // PDF annotations

  // Verification
  verifications   MilestoneVerification[]

  milestone       Milestone              @relation(fields: [milestoneId], references: [id], onDelete: Cascade)

  createdAt       DateTime               @default(now())
}

enum SubmissionStatus {
  PENDING
  UNDER_REVIEW
  APPROVED
  REJECTED
  REQUEST_INFO
}

model MilestoneVerification {
  id                String                  @id @default(cuid())
  submissionId      String
  type              VerificationType
  status            VerificationResultStatus
  performedBy       String?                 // userId for expert; null for AI
  costTokens        Int
  qualityRating     VerificationQuality?    // colour-coded per Journey doc
  findings          Json                    // structured findings
  notes             String?

  submission        MilestoneSubmission     @relation(fields: [submissionId], references: [id], onDelete: Cascade)

  createdAt         DateTime                @default(now())
  completedAt       DateTime?
}

enum VerificationType {
  AI_AGENT
  EXPERT
  AUTO_GOLD_MARKETPLACE
}

enum VerificationResultStatus {
  IN_PROGRESS
  PASS
  FAIL
  INCONCLUSIVE
}

enum VerificationQuality {
  RED       // failing / serious issues
  AMBER     // passes with concerns
  GREEN     // clean pass
  GOLD      // expert-validated gold standard
}

// =========================================================================
// SERVICE MARKETPLACE
// =========================================================================

model ServiceProviderProfile {
  id              String       @id @default(cuid())
  companyId       String       @unique
  headline        String
  description     String
  categories      ServiceCategory[]
  hourlyRateCents Int?
  serviceAreas    String[]     // provinces
  licenceNumbers  Json?
  rating          Float?       // computed avg
  ratingCount     Int          @default(0)
  responseTimeHrs Int?         // computed

  company         Company      @relation(fields: [companyId], references: [id])

  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
}

enum ServiceCategory {
  STRUCTURAL_CIVILS
  ENGINEERING
  LEGAL
  LOGISTICS_PLANT_HIRE
  FINANCE_INSURANCE
}

model Rfq {
  id              String       @id @default(cuid())
  projectId       String
  milestoneId     String?
  category        ServiceCategory
  title           String
  description     String
  scopeOfWork     String
  budgetCentsMax  Int?
  deadlineDays    Int?
  status          RfqStatus    @default(OPEN)

  project         Project      @relation(fields: [projectId], references: [id])
  milestone       Milestone?   @relation(fields: [milestoneId], references: [id])
  bids            Bid[]
  jobCard         JobCard?

  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  closedAt        DateTime?
}

enum RfqStatus {
  OPEN
  REVIEWING_BIDS
  AWARDED
  CANCELLED
  EXPIRED
}

model Bid {
  id              String       @id @default(cuid())
  rfqId           String
  providerCompanyId String
  amountCents     Int
  proposalText    String
  estimatedDays   Int
  status          BidStatus    @default(SUBMITTED)

  rfq             Rfq          @relation(fields: [rfqId], references: [id], onDelete: Cascade)
  providerCompany Company      @relation(fields: [providerCompanyId], references: [id])

  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
}

enum BidStatus {
  SUBMITTED
  ACCEPTED
  REJECTED
  WITHDRAWN
}

model JobCard {
  id              String       @id @default(cuid())
  rfqId           String       @unique
  providerCompanyId String
  scopeOfWork     String
  amountCents     Int
  escrowStatus    EscrowStatus @default(LOCKED)
  status          JobCardStatus @default(ACTIVE)

  rfq             Rfq          @relation(fields: [rfqId], references: [id])
  providerCompany Company      @relation("JobCardProvider", fields: [providerCompanyId], references: [id])
  deliverables    JobDeliverable[]
  messages        JobMessage[]
  review          Review?

  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  completedAt     DateTime?
}

enum JobCardStatus {
  ACTIVE
  PENDING_REVIEW
  COMPLETED
  DISPUTED
  CANCELLED
}

enum EscrowStatus {
  LOCKED
  RELEASED
  REFUNDED
  DISPUTED
}

model JobDeliverable {
  id          String   @id @default(cuid())
  jobCardId   String
  name        String
  url         String
  version     Int      @default(1)

  jobCard     JobCard  @relation(fields: [jobCardId], references: [id], onDelete: Cascade)

  createdAt   DateTime @default(now())
}

model JobMessage {
  id          String   @id @default(cuid())
  jobCardId   String
  senderUserId String
  body        String
  attachmentUrl String?

  jobCard     JobCard  @relation(fields: [jobCardId], references: [id], onDelete: Cascade)

  createdAt   DateTime @default(now())
  @@index([jobCardId, createdAt])
}

model Review {
  id              String       @id @default(cuid())
  jobCardId       String       @unique
  reviewedCompanyId String
  rating          Int          // 1-5
  text            String

  jobCard         JobCard      @relation(fields: [jobCardId], references: [id])
  reviewedCompany Company      @relation("ReviewedCompany", fields: [reviewedCompanyId], references: [id])

  createdAt       DateTime     @default(now())
}

// =========================================================================
// HARDWARE MARKETPLACE
// =========================================================================

model HardwareListing {
  id              String       @id @default(cuid())
  category        HardwareCategory
  manufacturer    String
  model           String
  sku             String       @unique
  description     String
  priceCents      Int
  stockQty        Int          @default(0)
  imageUrl        String?
  specs           Json
  isAffiliate     Boolean      @default(false)
  affiliateUrl    String?

  orderItems      OrderItem[]

  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
}

enum HardwareCategory {
  SOLAR_PANEL
  BATTERY
  INVERTER
  GENERATOR
  ACCESSORY
}

model Order {
  id                String       @id @default(cuid())
  companyId         String
  status            OrderStatus  @default(PENDING_PAYMENT)
  subtotalCents     Int
  tokenDiscountCents Int         @default(0)
  tokensApplied     Int          @default(0)
  totalCents        Int
  cashbackTokensEarned Int       @default(0)
  paymentRef        String?

  company           Company      @relation(fields: [companyId], references: [id])
  items             OrderItem[]

  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
}

enum OrderStatus {
  PENDING_PAYMENT
  PAID
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

model OrderItem {
  id              String          @id @default(cuid())
  orderId         String
  listingId       String
  qty             Int
  priceCentsAtPurchase Int

  order           Order           @relation(fields: [orderId], references: [id], onDelete: Cascade)
  listing         HardwareListing @relation(fields: [listingId], references: [id])
}

// =========================================================================
// O&M MONITORING
// =========================================================================

model OmReading {
  id                String   @id @default(cuid())
  projectId         String
  inverterBrand     String   // WEG, Victron, SunSynk, Deye
  recordedAt        DateTime
  productionKwh     Float
  batterySoCPercent Float?
  consumptionKwh    Float?
  gridImportKwh     Float?
  gridExportKwh     Float?
  ambientTempC      Float?
  irradianceWM2     Float?

  project           Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId, recordedAt])
}

// NOTE: OmContract has been replaced by OmLicense (see 09_PAYMENTS_AND_LICENSING.md).
// O&M is now licensed per (project × company × viewer type) with EPC and Client view
// licenses sold independently or via EPC-as-reseller flow with commissions.

model OmEvent {
  id          String      @id @default(cuid())
  projectId   String
  type        OmEventType
  title       String
  description String?
  scheduledAt DateTime
  completedAt DateTime?
  attachments Json?

  createdAt   DateTime    @default(now())
}

enum OmEventType {
  MAINTENANCE
  CLEANING
  INSPECTION
  REPAIR
  CLIENT_MEETING
  SITE_VISIT
  ALERT
}

// =========================================================================
// PROJECT SALE
// =========================================================================

model ProjectSaleListing {
  id              String       @id @default(cuid())
  projectId       String       @unique
  listedByCompanyId String
  askingPriceCents Int
  aiValuationCents Int
  status          SaleListingStatus @default(ACTIVE)
  description     String

  project         Project      @relation(fields: [projectId], references: [id])

  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
}

enum SaleListingStatus {
  ACTIVE
  UNDER_OFFER
  SOLD
  WITHDRAWN
}

// =========================================================================
// CONTENT & AI
// =========================================================================

model NewsItem {
  id          String   @id @default(cuid())
  title       String
  summary     String
  source      String
  sourceUrl   String
  category    String
  publishedAt DateTime
  imageUrl    String?

  createdAt   DateTime @default(now())

  @@index([publishedAt])
}

model AiConversation {
  id          String       @id @default(cuid())
  userId      String
  title       String?

  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages    AiMessage[]

  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model AiMessage {
  id              String         @id @default(cuid())
  conversationId  String
  role            AiMessageRole
  content         String         // markdown / plain
  toolCalls       Json?          // tool calls made
  toolResults     Json?

  conversation    AiConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  createdAt       DateTime       @default(now())
}

enum AiMessageRole {
  USER
  ASSISTANT
  SYSTEM
  TOOL
}

// =========================================================================
// NOTIFICATIONS & AUDIT
// =========================================================================

model Notification {
  id          String           @id @default(cuid())
  userId      String?
  companyId   String?
  type        NotificationType
  title       String
  body        String
  link        String?
  readAt      DateTime?

  user        User?            @relation(fields: [userId], references: [id], onDelete: Cascade)
  company     Company?         @relation(fields: [companyId], references: [id], onDelete: Cascade)

  createdAt   DateTime         @default(now())
  @@index([userId, readAt])
  @@index([companyId, readAt])
}

enum NotificationType {
  MILESTONE_SUBMITTED
  MILESTONE_APPROVED
  MILESTONE_REJECTED
  KYC_APPROVED
  KYC_REJECTED
  TIER_UP
  RFQ_BID_RECEIVED
  RFQ_BID_ACCEPTED
  JOB_DELIVERABLE_READY
  OM_ALERT
  AI_VERIFICATION_COMPLETE
  TOKEN_AWARDED
  ORDER_STATUS
  SYSTEM
}

model AuditLog {
  id          String   @id @default(cuid())
  userId      String?
  entityType  String
  entityId    String
  action      String
  metadata    Json?

  user        User?    @relation(fields: [userId], references: [id])

  createdAt   DateTime @default(now())
  @@index([entityType, entityId])
  @@index([userId, createdAt])
}

// =========================================================================
// PROJECT COMMUNICATIONS
// =========================================================================
// Models defined in 08_COMMUNICATIONS.md:
//   ProjectWorkspace, Channel, ChannelMembership, Message, MessageReaction
//
// These models reference and are referenced by:
//   - User (channelMemberships, messages, messageReactions)
//   - Project (workspace)
//   - Milestone (channel — bidirectional for milestone thread integration)
//
// Include the schema block from 08_COMMUNICATIONS.md §"Schema additions" in the
// final schema.prisma file. Also patch the existing User, Project, and Milestone
// models with the back-relations specified there.

// =========================================================================
// PAYMENTS, INVOICING & O&M LICENSING
// =========================================================================
// Models defined in 09_PAYMENTS_AND_LICENSING.md:
//   Invoice, InvoiceLineItem, Payment, PlatformBankAccount,
//   OmLicense, LicenseOffer, LicenseCommission,
//   EnterpriseLicense, EnterpriseProjectScope, EnterpriseIntegration,
//   EnterpriseSeat, EnterpriseUsageRecord
//
// These models reference and are referenced by:
//   - Company (invoicesIssued, invoicesReceived, licensesHeld, licensesResold,
//              commissions, enterpriseLicensesHeld, enterpriseLicensesResold)
//   - Project (omLicenses, enterpriseScopes — replaces former OmContract relation)
//   - User (enterpriseSeats)
//
// Include the schema blocks from 09_PAYMENTS_AND_LICENSING.md §"Schema additions"
// and §"Enterprise tier > Schema additions" in the final schema.prisma file.
// Patch the existing Company, Project, User, and OmLicense models with the
// back-relations specified there. The OmContract model defined earlier in this
// file is removed in the same migration.
//
// Self-serve and Enterprise are mutually exclusive per project. When an
// EnterpriseLicense covers a project, the CLIENT-viewer OmLicense for that
// project transitions to SUPERSEDED_BY_ENTERPRISE. The EPC-viewer OmLicense
// remains ACTIVE (bundled with the Enterprise license).
```

---

## Notes on key relationships

**User ↔ Company.** Many-to-many via `Membership`, with a `Role` per membership. Allows the Journey doc's "role switching" — a Service Provider company can also be a Contractor company; that's the same `Company` record with one membership, and the user's profile may have memberships in *multiple* companies.

**Project ↔ MilestoneTemplate.** Templates are versioned. When a Project is created, the matching template is **snapshotted** into `Project.templateSnapshot` (JSONB), and concrete `Milestone` rows are instantiated from `MilestoneTemplateItem`s. This preserves immutability: future template edits don't break active projects (per Scope §Admin 2.d versioning control).

**Milestone ↔ Submission ↔ Verification.** A milestone can have many submissions (versions). Each submission can have multiple verifications (AI, expert, marketplace auto-gold). The latest approved submission marks the milestone complete.

**Rfq ↔ JobCard.** When a contractor accepts a bid, the RFQ status moves to `AWARDED` and a `JobCard` is created. Escrow is "locked" — for the prototype, that's a status change, not a real fund transfer. On completion, escrow `RELEASED` triggers a `Payout` (not modelled — out of scope; the wallet just increments).

**Project sale listings.** Only PPA/Lease projects can be listed by the EPC; only outright-purchase projects can be listed by the Client (per Journey doc). Enforce at the service layer.

---

## Indexes

The schema includes targeted `@@index` declarations. Key access patterns:

- Contractor dashboard: projects by `(contractorCompanyId, stage)`
- Milestone list: by `(projectId, order)`
- Audit queries: by `(entityType, entityId)` and `(userId, createdAt)`
- Notifications: by `(userId, readAt)` for unread counts
- O&M charts: by `(projectId, recordedAt)`

---

## Migrations strategy

For the prototype:

1. Initial migration: `prisma migrate dev --name init` after schema is locked
2. Subsequent changes: one migration per feature PR, named descriptively (`add_project_sale_listing`)
3. Migrations checked into Git
4. Vercel deploy runs `prisma migrate deploy` as build step

No squash, no resets after initial. Demo data is reproducible via the seed script.

---

## Soft delete pattern

Where `deletedAt` is present (User, Company, Project), implement a global Prisma middleware that filters out soft-deleted records from all reads unless explicitly opted-in. Restore is just a `deletedAt: null` update.
