-- CreateTable
CREATE TABLE "PlayerNotice" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "variant" TEXT NOT NULL DEFAULT 'info',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "PlayerNotice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayerNotice_playerId_idx" ON "PlayerNotice"("playerId");

-- AddForeignKey
ALTER TABLE "PlayerNotice" ADD CONSTRAINT "PlayerNotice_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
