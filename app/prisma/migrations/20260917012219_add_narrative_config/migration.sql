-- CreateTable
CREATE TABLE "NarrativeConfig" (
    "id" TEXT NOT NULL,
    "persona" TEXT NOT NULL,
    "detailShort" TEXT NOT NULL,
    "detailMedium" TEXT NOT NULL,
    "detailLong" TEXT NOT NULL,
    "detailEpic" TEXT NOT NULL,
    "extraDirectives" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NarrativeConfig_pkey" PRIMARY KEY ("id")
);
