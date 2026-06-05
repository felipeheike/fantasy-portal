-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "aiPreferences" JSONB,
ADD COLUMN     "apiKeys" JSONB,
ADD COLUMN     "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mfaSecret" TEXT,
ADD COLUMN     "usageStats" JSONB;
