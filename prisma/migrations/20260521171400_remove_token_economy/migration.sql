-- Remove token economy: drop WalletBalance, TokenTransaction, TokenTransactionType,
-- costTokens from MilestoneVerification, and token fields from Order.

-- AlterTable: MilestoneVerification — drop costTokens
ALTER TABLE "MilestoneVerification" DROP COLUMN "costTokens";

-- AlterTable: Order — drop token-related columns
ALTER TABLE "Order" DROP COLUMN "cashbackTokensEarned";
ALTER TABLE "Order" DROP COLUMN "tokenDiscountCents";
ALTER TABLE "Order" DROP COLUMN "tokensApplied";

-- DropTable
DROP TABLE "TokenTransaction";

-- DropTable
DROP TABLE "WalletBalance";

-- DropEnum
DROP TYPE "TokenTransactionType";
