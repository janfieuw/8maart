/*
  Warnings:

  - You are about to drop the column `dailyMinutes` on the `Employee` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[companyId,pairCode]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Employee_name_idx";

-- DropIndex
DROP INDEX "Employee_pairCode_key";

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "dailyMinutes";

-- CreateIndex
CREATE INDEX "Employee_companyId_name_idx" ON "Employee"("companyId", "name");

-- CreateIndex
CREATE INDEX "Employee_companyId_active_idx" ON "Employee"("companyId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_companyId_pairCode_key" ON "Employee"("companyId", "pairCode");

-- CreateIndex
CREATE INDEX "ScanEvent_companyId_employeeId_scannedAt_idx" ON "ScanEvent"("companyId", "employeeId", "scannedAt");

-- CreateIndex
CREATE INDEX "ScanEvent_companyId_type_scannedAt_idx" ON "ScanEvent"("companyId", "type", "scannedAt");
