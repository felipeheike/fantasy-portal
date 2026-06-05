-- CreateTable
CREATE TABLE "Scene" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "narration" TEXT NOT NULL,
    "visualDescription" TEXT NOT NULL,
    "audioDescription" TEXT,
    "imageUrl" TEXT,
    "audioUrl" TEXT,
    "options" JSONB,
    "tacticalOptions" JSONB,
    "puzzle" JSONB,
    "selectedOption" TEXT,
    "statusChanges" JSONB,
    "inventoryChanges" JSONB,
    "skillChanges" JSONB,
    "worldUpdate" JSONB,
    "isGameOver" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Scene_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Scene_journeyId_idx" ON "Scene"("journeyId");

-- CreateIndex
CREATE INDEX "Scene_order_idx" ON "Scene"("order");

-- AddForeignKey
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
