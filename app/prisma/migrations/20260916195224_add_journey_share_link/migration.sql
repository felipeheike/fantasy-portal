-- CreateTable
CREATE TABLE "JourneyShareLink" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "shareTokenHash" TEXT NOT NULL,
    "sessionTokenHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemExpiresAt" TIMESTAMP(3) NOT NULL,
    "redeemedAt" TIMESTAMP(3),
    "sessionExpiresAt" TIMESTAMP(3),

    CONSTRAINT "JourneyShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JourneyShareLink_shareTokenHash_key" ON "JourneyShareLink"("shareTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "JourneyShareLink_sessionTokenHash_key" ON "JourneyShareLink"("sessionTokenHash");

-- CreateIndex
CREATE INDEX "JourneyShareLink_journeyId_idx" ON "JourneyShareLink"("journeyId");

-- AddForeignKey
ALTER TABLE "JourneyShareLink" ADD CONSTRAINT "JourneyShareLink_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
