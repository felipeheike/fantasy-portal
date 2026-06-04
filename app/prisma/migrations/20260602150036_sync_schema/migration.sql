-- AlterTable
ALTER TABLE "Journey" ADD COLUMN     "memories" JSONB,
ADD COLUMN     "settings" JSONB;

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "accountStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "forcePasswordChange" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'PLAYER';
