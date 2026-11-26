-- AlterTable
ALTER TABLE "Player" ADD COLUMN "oidcSubject" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Player_oidcSubject_key" ON "Player"("oidcSubject");
