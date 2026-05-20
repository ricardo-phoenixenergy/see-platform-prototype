-- AlterEnum
ALTER TYPE "DealStructure" ADD VALUE 'WHEELING_AGREEMENT';

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "clientRecordId" TEXT,
ADD COLUMN     "techScope" JSONB;

-- CreateTable
CREATE TABLE "ClientRecord" (
    "id" TEXT NOT NULL,
    "contractorCompanyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "industry" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientRecord_contractorCompanyId_idx" ON "ClientRecord"("contractorCompanyId");

-- AddForeignKey
ALTER TABLE "ClientRecord" ADD CONSTRAINT "ClientRecord_contractorCompanyId_fkey" FOREIGN KEY ("contractorCompanyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_clientRecordId_fkey" FOREIGN KEY ("clientRecordId") REFERENCES "ClientRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
