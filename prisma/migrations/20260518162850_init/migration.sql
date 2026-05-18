-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('CONTRACTOR', 'SERVICE_PROVIDER', 'END_CLIENT', 'PLATFORM_ADMIN');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CONTRACTOR', 'SERVICE_PROVIDER', 'CLIENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REQUEST_INFO');

-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "TokenTransactionType" AS ENUM ('EARN_TUTORIAL', 'EARN_PROJECT_CREATE', 'EARN_SERVICE_REQUEST', 'EARN_EXISTING_PROJECT_UPLOAD', 'EARN_CASHBACK', 'EARN_TIER_BONUS', 'SPEND_AI_VERIFICATION', 'SPEND_EXPERT_VERIFICATION', 'SPEND_COMPANY_PROFILE_GEN', 'SPEND_HARDWARE_DISCOUNT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "Technology" AS ENUM ('SOLAR_PV', 'WIND', 'BESS', 'HYBRID');

-- CreateEnum
CREATE TYPE "GridConnectionStatus" AS ENUM ('GRID_TIED', 'OFF_GRID', 'GRID_TIED_WITH_BACKUP');

-- CreateEnum
CREATE TYPE "DealStructure" AS ENUM ('OUTRIGHT', 'PPA', 'LEASE');

-- CreateEnum
CREATE TYPE "ProjectStage" AS ENUM ('DEVELOPMENT', 'FINANCING', 'CONSTRUCTION', 'COMMISSIONING', 'OPERATIONAL', 'DECOMMISSIONED');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('LOCKED', 'AVAILABLE', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'ACTION_REQUIRED', 'APPROVED', 'AUTO_GOLD');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REQUEST_INFO');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('AI_AGENT', 'EXPERT', 'AUTO_GOLD_MARKETPLACE');

-- CreateEnum
CREATE TYPE "VerificationResultStatus" AS ENUM ('IN_PROGRESS', 'PASS', 'FAIL', 'INCONCLUSIVE');

-- CreateEnum
CREATE TYPE "VerificationQuality" AS ENUM ('RED', 'AMBER', 'GREEN', 'GOLD');

-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('STRUCTURAL_CIVILS', 'ENGINEERING', 'LEGAL', 'LOGISTICS_PLANT_HIRE', 'FINANCE_INSURANCE');

-- CreateEnum
CREATE TYPE "RfqStatus" AS ENUM ('OPEN', 'REVIEWING_BIDS', 'AWARDED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('SUBMITTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "JobCardStatus" AS ENUM ('ACTIVE', 'PENDING_REVIEW', 'COMPLETED', 'DISPUTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('LOCKED', 'RELEASED', 'REFUNDED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "HardwareCategory" AS ENUM ('SOLAR_PANEL', 'BATTERY', 'INVERTER', 'GENERATOR', 'ACCESSORY');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "OmEventType" AS ENUM ('MAINTENANCE', 'CLEANING', 'INSPECTION', 'REPAIR', 'CLIENT_MEETING', 'SITE_VISIT', 'ALERT');

-- CreateEnum
CREATE TYPE "SaleListingStatus" AS ENUM ('ACTIVE', 'UNDER_OFFER', 'SOLD', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "AiMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM', 'TOOL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MILESTONE_SUBMITTED', 'MILESTONE_APPROVED', 'MILESTONE_REJECTED', 'KYC_APPROVED', 'KYC_REJECTED', 'TIER_UP', 'RFQ_BID_RECEIVED', 'RFQ_BID_ACCEPTED', 'JOB_DELIVERABLE_READY', 'OM_ALERT', 'AI_VERIFICATION_COMPLETE', 'TOKEN_AWARDED', 'ORDER_STATUS', 'MESSAGE_MENTION', 'MESSAGE_REPLY_TO_YOU', 'CHANNEL_INVITE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ChannelKind" AS ENUM ('DEFAULT', 'CUSTOM', 'MILESTONE_THREAD', 'DIRECT');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'MEMBER', 'GUEST', 'OBSERVER');

-- CreateEnum
CREATE TYPE "InvoiceIssuer" AS ENUM ('PLATFORM', 'COMPANY');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'AWAITING_PAYMENT', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LineItemType" AS ENUM ('OM_LICENSE_ACTIVATION', 'OM_LICENSE_RENEWAL', 'AI_VERIFICATION', 'EXPERT_VERIFICATION', 'PLATFORM_FEE', 'HARDWARE', 'SUBSCRIPTION', 'ESCROW_DEPOSIT', 'COMMISSION_PAYOUT', 'TOKEN_PURCHASE');

-- CreateEnum
CREATE TYPE "PaymentRail" AS ENUM ('EFT', 'PAYFAST');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('INITIATED', 'AWAITING_PROOF', 'PROOF_UPLOADED', 'AWAITING_RECONCILIATION', 'PROCESSING', 'PAID', 'FAILED', 'DISPUTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OmViewerType" AS ENUM ('EPC', 'CLIENT');

-- CreateEnum
CREATE TYPE "OmLicenseTier" AS ENUM ('BASIC', 'PREMIUM', 'AI');

-- CreateEnum
CREATE TYPE "OmLicenseStatus" AS ENUM ('INACTIVE', 'PENDING_PAYMENT', 'ACTIVE', 'AWAITING_RENEWAL', 'LAPSED', 'CANCELLED', 'SUPERSEDED_BY_ENTERPRISE');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('ACCRUED', 'READY_TO_PAY', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EnterpriseLicenseStatus" AS ENUM ('DRAFT', 'PENDING_SETUP', 'ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ReviewCadence" AS ENUM ('QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL');

-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('OUTBOUND_API', 'OUTBOUND_WEBHOOK', 'SCHEDULED_EXPORT', 'REALTIME_STREAM', 'INBOUND_FEED', 'CUSTOM_DASHBOARD', 'WHITE_LABEL');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('CONFIGURED', 'ACTIVE', 'ERROR', 'PAUSED');

-- CreateEnum
CREATE TYPE "EnterpriseSeatRole" AS ENUM ('ENTERPRISE_ADMIN', 'ENTERPRISE_FINANCE', 'ENTERPRISE_OPS', 'ENTERPRISE_VIEWER');

-- CreateEnum
CREATE TYPE "UsageMetric" AS ENUM ('API_CALLS', 'WEBHOOK_DELIVERIES', 'DATA_EXPORTS_GB');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "passwordHash" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CompanyType" NOT NULL,
    "registrationNo" TEXT,
    "vatNo" TEXT,
    "beeeLevel" INTEGER,
    "logoUrl" TEXT,
    "about" TEXT,
    "websiteUrl" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "bankName" TEXT,
    "bankAccountLast4" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isOwner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycSubmission" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "cipcDocUrl" TEXT,
    "vatDocUrl" TEXT,
    "directorIdUrl" TEXT,
    "status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceDocument" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TierStatus" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tier" "Tier" NOT NULL DEFAULT 'BRONZE',
    "compliantProjectCount" INTEGER NOT NULL DEFAULT 0,
    "pointsToNextTier" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TierStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletBalance" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tokens" INTEGER NOT NULL DEFAULT 0,
    "fiatCents" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenTransaction" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "TokenTransactionType" NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contractorCompanyId" TEXT NOT NULL,
    "clientCompanyId" TEXT,
    "externalClientName" TEXT,
    "siteId" TEXT NOT NULL,
    "technology" "Technology" NOT NULL,
    "gridConnectionStatus" "GridConnectionStatus" NOT NULL,
    "systemSizeKw" DOUBLE PRECISION NOT NULL,
    "storageSizeKwh" DOUBLE PRECISION,
    "dealStructure" "DealStructure" NOT NULL,
    "contractValueCents" INTEGER,
    "ppaTariffCents" INTEGER,
    "stage" "ProjectStage" NOT NULL DEFAULT 'DEVELOPMENT',
    "templateSnapshot" JSONB NOT NULL,
    "templateVersion" INTEGER NOT NULL,
    "clientNeeds" TEXT,
    "completionPercentage" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'South Africa',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "irradianceKwhM2Day" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectDocument" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilestoneTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "technology" "Technology" NOT NULL,
    "minSizeKw" DOUBLE PRECISION,
    "maxSizeKw" DOUBLE PRECISION,
    "dealStructure" "DealStructure"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MilestoneTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilestoneTemplateItem" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "phase" "ProjectStage" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isHardGate" BOOLEAN NOT NULL DEFAULT true,
    "requiredArtefacts" JSONB NOT NULL,
    "estimatedDays" INTEGER,

    CONSTRAINT "MilestoneTemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "templateItemId" TEXT,
    "order" INTEGER NOT NULL,
    "phase" "ProjectStage" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isHardGate" BOOLEAN NOT NULL,
    "requiredArtefacts" JSONB NOT NULL,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'LOCKED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilestoneSubmission" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "submittedBy" TEXT NOT NULL,
    "artefacts" JSONB NOT NULL,
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "feedback" TEXT,
    "rejectionAnnotations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MilestoneSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilestoneVerification" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "type" "VerificationType" NOT NULL,
    "status" "VerificationResultStatus" NOT NULL,
    "performedBy" TEXT,
    "costTokens" INTEGER NOT NULL,
    "qualityRating" "VerificationQuality",
    "findings" JSONB NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MilestoneVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceProviderProfile" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categories" "ServiceCategory"[],
    "hourlyRateCents" INTEGER,
    "serviceAreas" TEXT[],
    "licenceNumbers" JSONB,
    "rating" DOUBLE PRECISION,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "responseTimeHrs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceProviderProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rfq" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "category" "ServiceCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scopeOfWork" TEXT NOT NULL,
    "budgetCentsMax" INTEGER,
    "deadlineDays" INTEGER,
    "status" "RfqStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Rfq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "providerCompanyId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "proposalText" TEXT NOT NULL,
    "estimatedDays" INTEGER NOT NULL,
    "status" "BidStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobCard" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "providerCompanyId" TEXT NOT NULL,
    "scopeOfWork" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "escrowStatus" "EscrowStatus" NOT NULL DEFAULT 'LOCKED',
    "status" "JobCardStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "JobCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobDeliverable" (
    "id" TEXT NOT NULL,
    "jobCardId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobDeliverable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobMessage" (
    "id" TEXT NOT NULL,
    "jobCardId" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "jobCardId" TEXT NOT NULL,
    "reviewedCompanyId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HardwareListing" (
    "id" TEXT NOT NULL,
    "category" "HardwareCategory" NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "stockQty" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "specs" JSONB NOT NULL,
    "isAffiliate" BOOLEAN NOT NULL DEFAULT false,
    "affiliateUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HardwareListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "subtotalCents" INTEGER NOT NULL,
    "tokenDiscountCents" INTEGER NOT NULL DEFAULT 0,
    "tokensApplied" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL,
    "cashbackTokensEarned" INTEGER NOT NULL DEFAULT 0,
    "paymentRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "priceCentsAtPurchase" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OmReading" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "inverterBrand" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "productionKwh" DOUBLE PRECISION NOT NULL,
    "batterySoCPercent" DOUBLE PRECISION,
    "consumptionKwh" DOUBLE PRECISION,
    "gridImportKwh" DOUBLE PRECISION,
    "gridExportKwh" DOUBLE PRECISION,
    "ambientTempC" DOUBLE PRECISION,
    "irradianceWM2" DOUBLE PRECISION,

    CONSTRAINT "OmReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OmEvent" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "OmEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OmEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectSaleListing" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "listedByCompanyId" TEXT NOT NULL,
    "askingPriceCents" INTEGER NOT NULL,
    "aiValuationCents" INTEGER NOT NULL,
    "status" "SaleListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectSaleListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "AiMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "toolCalls" JSONB,
    "toolResults" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "companyId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectWorkspace" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectWorkspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "description" TEXT,
    "kind" "ChannelKind" NOT NULL,
    "topic" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "milestoneId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3),

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelMembership" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'MEMBER',
    "lastReadAt" TIMESTAMP(3),
    "isMuted" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "ChannelMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "parentMessageId" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "attachments" JSONB,
    "entityRefs" JSONB,
    "mentions" JSONB,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageReaction" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "issuerType" "InvoiceIssuer" NOT NULL,
    "issuerCompanyId" TEXT,
    "recipientCompanyId" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotalCents" INTEGER NOT NULL,
    "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "vatCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLineItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unitPriceCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "type" "LineItemType" NOT NULL,
    "relatedEntityId" TEXT,

    CONSTRAINT "InvoiceLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "rail" "PaymentRail" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'INITIATED',
    "reference" TEXT,
    "proofOfPaymentUrl" TEXT,
    "payfastTxnId" TEXT,
    "reconciledByUserId" TEXT,
    "reconciledAt" TIMESTAMP(3),
    "bankReference" TEXT,
    "disputeReason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformBankAccount" (
    "id" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "branchCode" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "swiftCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformBankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OmLicense" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "licenseeCompanyId" TEXT NOT NULL,
    "viewerType" "OmViewerType" NOT NULL,
    "tier" "OmLicenseTier" NOT NULL,
    "status" "OmLicenseStatus" NOT NULL DEFAULT 'INACTIVE',
    "monthlyFeeCents" INTEGER NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "nextBillingAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "lapsedAt" TIMESTAMP(3),
    "resellerCompanyId" TEXT,
    "commissionRate" DOUBLE PRECISION,
    "supersedingEnterpriseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OmLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LicenseOffer" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "proposedByCompanyId" TEXT NOT NULL,
    "proposedToCompanyId" TEXT NOT NULL,
    "tier" "OmLicenseTier" NOT NULL,
    "monthlyFeeCents" INTEGER NOT NULL,
    "commissionRateOffered" DOUBLE PRECISION NOT NULL,
    "message" TEXT,
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LicenseOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LicenseCommission" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "resellerCompanyId" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'ACCRUED',
    "paidAt" TIMESTAMP(3),
    "payoutBatchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LicenseCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnterpriseLicense" (
    "id" TEXT NOT NULL,
    "clientCompanyId" TEXT NOT NULL,
    "status" "EnterpriseLicenseStatus" NOT NULL DEFAULT 'DRAFT',
    "contractReference" TEXT NOT NULL,
    "contractStartDate" TIMESTAMP(3) NOT NULL,
    "contractEndDate" TIMESTAMP(3),
    "reviewCadence" "ReviewCadence" NOT NULL,
    "nextReviewDate" TIMESTAMP(3),
    "baseMonthlyFeeCents" INTEGER NOT NULL,
    "perSeatMonthlyFeeCents" INTEGER NOT NULL DEFAULT 0,
    "perIntegrationFees" JSONB NOT NULL,
    "usageRates" JSONB NOT NULL,
    "oneTimeSetupFeeCents" INTEGER NOT NULL DEFAULT 0,
    "oneTimeSetupInvoiced" BOOLEAN NOT NULL DEFAULT false,
    "resellerCompanyId" TEXT,
    "negotiatedCommissionRate" DOUBLE PRECISION,
    "customDashboardConfig" JSONB,
    "brandingConfig" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "EnterpriseLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnterpriseProjectScope" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "EnterpriseProjectScope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnterpriseIntegration" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "type" "IntegrationType" NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'CONFIGURED',
    "config" JSONB NOT NULL,
    "lastActivityAt" TIMESTAMP(3),
    "monthlyFeeCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnterpriseIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnterpriseSeat" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seatRole" "EnterpriseSeatRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivatedAt" TIMESTAMP(3),

    CONSTRAINT "EnterpriseSeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnterpriseUsageRecord" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "metric" "UsageMetric" NOT NULL,
    "units" INTEGER NOT NULL,
    "billedCents" INTEGER NOT NULL,

    CONSTRAINT "EnterpriseUsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Membership_companyId_idx" ON "Membership"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_companyId_key" ON "Membership"("userId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "TierStatus_companyId_key" ON "TierStatus"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletBalance_companyId_key" ON "WalletBalance"("companyId");

-- CreateIndex
CREATE INDEX "TokenTransaction_companyId_createdAt_idx" ON "TokenTransaction"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Project_siteId_key" ON "Project"("siteId");

-- CreateIndex
CREATE INDEX "Project_contractorCompanyId_stage_idx" ON "Project"("contractorCompanyId", "stage");

-- CreateIndex
CREATE INDEX "Project_clientCompanyId_idx" ON "Project"("clientCompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "MilestoneTemplateItem_templateId_order_key" ON "MilestoneTemplateItem"("templateId", "order");

-- CreateIndex
CREATE INDEX "Milestone_projectId_order_idx" ON "Milestone"("projectId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceProviderProfile_companyId_key" ON "ServiceProviderProfile"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "JobCard_rfqId_key" ON "JobCard"("rfqId");

-- CreateIndex
CREATE INDEX "JobMessage_jobCardId_createdAt_idx" ON "JobMessage"("jobCardId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Review_jobCardId_key" ON "Review"("jobCardId");

-- CreateIndex
CREATE UNIQUE INDEX "HardwareListing_sku_key" ON "HardwareListing"("sku");

-- CreateIndex
CREATE INDEX "OmReading_projectId_recordedAt_idx" ON "OmReading"("projectId", "recordedAt");

-- CreateIndex
CREATE INDEX "OmEvent_projectId_scheduledAt_idx" ON "OmEvent"("projectId", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSaleListing_projectId_key" ON "ProjectSaleListing"("projectId");

-- CreateIndex
CREATE INDEX "NewsItem_publishedAt_idx" ON "NewsItem"("publishedAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_companyId_readAt_idx" ON "Notification"("companyId", "readAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectWorkspace_projectId_key" ON "ProjectWorkspace"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Channel_milestoneId_key" ON "Channel"("milestoneId");

-- CreateIndex
CREATE INDEX "Channel_workspaceId_lastMessageAt_idx" ON "Channel"("workspaceId", "lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "Channel_workspaceId_name_key" ON "Channel"("workspaceId", "name");

-- CreateIndex
CREATE INDEX "ChannelMembership_userId_lastReadAt_idx" ON "ChannelMembership"("userId", "lastReadAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelMembership_channelId_userId_key" ON "ChannelMembership"("channelId", "userId");

-- CreateIndex
CREATE INDEX "Message_channelId_createdAt_idx" ON "Message"("channelId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_parentMessageId_createdAt_idx" ON "Message"("parentMessageId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_authorUserId_createdAt_idx" ON "Message"("authorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "MessageReaction_messageId_idx" ON "MessageReaction"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageReaction_messageId_userId_emoji_key" ON "MessageReaction"("messageId", "userId", "emoji");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_recipientCompanyId_status_idx" ON "Invoice"("recipientCompanyId", "status");

-- CreateIndex
CREATE INDEX "Invoice_issuerCompanyId_status_idx" ON "Invoice"("issuerCompanyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");

-- CreateIndex
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_reference_idx" ON "Payment"("reference");

-- CreateIndex
CREATE INDEX "OmLicense_licenseeCompanyId_status_idx" ON "OmLicense"("licenseeCompanyId", "status");

-- CreateIndex
CREATE INDEX "OmLicense_resellerCompanyId_status_idx" ON "OmLicense"("resellerCompanyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "OmLicense_projectId_viewerType_status_key" ON "OmLicense"("projectId", "viewerType", "status");

-- CreateIndex
CREATE INDEX "LicenseCommission_resellerCompanyId_status_idx" ON "LicenseCommission"("resellerCompanyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LicenseCommission_licenseId_period_key" ON "LicenseCommission"("licenseId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "EnterpriseLicense_contractReference_key" ON "EnterpriseLicense"("contractReference");

-- CreateIndex
CREATE INDEX "EnterpriseLicense_clientCompanyId_status_idx" ON "EnterpriseLicense"("clientCompanyId", "status");

-- CreateIndex
CREATE INDEX "EnterpriseLicense_resellerCompanyId_idx" ON "EnterpriseLicense"("resellerCompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "EnterpriseProjectScope_licenseId_projectId_key" ON "EnterpriseProjectScope"("licenseId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "EnterpriseSeat_licenseId_userId_key" ON "EnterpriseSeat"("licenseId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "EnterpriseUsageRecord_licenseId_period_metric_key" ON "EnterpriseUsageRecord"("licenseId", "period", "metric");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycSubmission" ADD CONSTRAINT "KycSubmission_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceDocument" ADD CONSTRAINT "ComplianceDocument_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierStatus" ADD CONSTRAINT "TierStatus_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletBalance" ADD CONSTRAINT "WalletBalance_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenTransaction" ADD CONSTRAINT "TokenTransaction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_contractorCompanyId_fkey" FOREIGN KEY ("contractorCompanyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_clientCompanyId_fkey" FOREIGN KEY ("clientCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneTemplateItem" ADD CONSTRAINT "MilestoneTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "MilestoneTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneSubmission" ADD CONSTRAINT "MilestoneSubmission_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneVerification" ADD CONSTRAINT "MilestoneVerification_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "MilestoneSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceProviderProfile" ADD CONSTRAINT "ServiceProviderProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rfq" ADD CONSTRAINT "Rfq_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rfq" ADD CONSTRAINT "Rfq_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_providerCompanyId_fkey" FOREIGN KEY ("providerCompanyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCard" ADD CONSTRAINT "JobCard_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCard" ADD CONSTRAINT "JobCard_providerCompanyId_fkey" FOREIGN KEY ("providerCompanyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobDeliverable" ADD CONSTRAINT "JobDeliverable_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "JobCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobMessage" ADD CONSTRAINT "JobMessage_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "JobCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "JobCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewedCompanyId_fkey" FOREIGN KEY ("reviewedCompanyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "HardwareListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OmReading" ADD CONSTRAINT "OmReading_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OmEvent" ADD CONSTRAINT "OmEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSaleListing" ADD CONSTRAINT "ProjectSaleListing_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSaleListing" ADD CONSTRAINT "ProjectSaleListing_listedByCompanyId_fkey" FOREIGN KEY ("listedByCompanyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiConversation" ADD CONSTRAINT "AiConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMessage" ADD CONSTRAINT "AiMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AiConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectWorkspace" ADD CONSTRAINT "ProjectWorkspace_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "ProjectWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelMembership" ADD CONSTRAINT "ChannelMembership_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelMembership" ADD CONSTRAINT "ChannelMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_parentMessageId_fkey" FOREIGN KEY ("parentMessageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_issuerCompanyId_fkey" FOREIGN KEY ("issuerCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_recipientCompanyId_fkey" FOREIGN KEY ("recipientCompanyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OmLicense" ADD CONSTRAINT "OmLicense_supersedingEnterpriseId_fkey" FOREIGN KEY ("supersedingEnterpriseId") REFERENCES "EnterpriseLicense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OmLicense" ADD CONSTRAINT "OmLicense_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OmLicense" ADD CONSTRAINT "OmLicense_licenseeCompanyId_fkey" FOREIGN KEY ("licenseeCompanyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OmLicense" ADD CONSTRAINT "OmLicense_resellerCompanyId_fkey" FOREIGN KEY ("resellerCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseOffer" ADD CONSTRAINT "LicenseOffer_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "OmLicense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseCommission" ADD CONSTRAINT "LicenseCommission_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "OmLicense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseCommission" ADD CONSTRAINT "LicenseCommission_resellerCompanyId_fkey" FOREIGN KEY ("resellerCompanyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseLicense" ADD CONSTRAINT "EnterpriseLicense_clientCompanyId_fkey" FOREIGN KEY ("clientCompanyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseLicense" ADD CONSTRAINT "EnterpriseLicense_resellerCompanyId_fkey" FOREIGN KEY ("resellerCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseProjectScope" ADD CONSTRAINT "EnterpriseProjectScope_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "EnterpriseLicense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseProjectScope" ADD CONSTRAINT "EnterpriseProjectScope_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseIntegration" ADD CONSTRAINT "EnterpriseIntegration_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "EnterpriseLicense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseSeat" ADD CONSTRAINT "EnterpriseSeat_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "EnterpriseLicense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseSeat" ADD CONSTRAINT "EnterpriseSeat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseUsageRecord" ADD CONSTRAINT "EnterpriseUsageRecord_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "EnterpriseLicense"("id") ON DELETE CASCADE ON UPDATE CASCADE;
