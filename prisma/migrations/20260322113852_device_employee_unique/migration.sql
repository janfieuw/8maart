/*
  Warnings:

  - A unique constraint covering the columns `[employeeId]` on the table `Device` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Device_employeeId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Device_employeeId_key" ON "Device"("employeeId");
