/*
  Warnings:

  - You are about to drop the column `scanLocationId` on the `ScanTag` table. All the data in the column will be lost.
  - You are about to drop the `ScanLocation` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[companyId,direction]` on the table `ScanTag` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `companyId` to the `ScanTag` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ScanLocation" DROP CONSTRAINT "ScanLocation_companyId_fkey";

-- DropForeignKey
ALTER TABLE "ScanTag" DROP CONSTRAINT "ScanTag_scanLocationId_fkey";

-- DropIndex
DROP INDEX "ScanTag_scanLocationId_direction_key";

-- DropIndex
DROP INDEX "ScanTag_scanLocationId_idx";

-- AlterTable
ALTER TABLE "ScanTag" DROP COLUMN "scanLocationId",
ADD COLUMN     "companyId" TEXT NOT NULL;

-- DropTable
DROP TABLE "ScanLocation";

-- CreateIndex
CREATE INDEX "ScanTag_companyId_idx" ON "ScanTag"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ScanTag_companyId_direction_key" ON "ScanTag"("companyId", "direction");

-- AddForeignKey
ALTER TABLE "ScanTag" ADD CONSTRAINT "ScanTag_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
