-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_authorUserId_fkey";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "isSystem" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "authorUserId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
