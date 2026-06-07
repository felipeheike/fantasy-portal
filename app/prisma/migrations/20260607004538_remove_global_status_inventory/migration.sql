/*
  Warnings:

  - You are about to drop the column `inventory` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Player` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Player" DROP COLUMN "inventory",
DROP COLUMN "status";
