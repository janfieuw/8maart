-- CreateTable
CREATE TABLE "AttendanceDay" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "expectedMin" INTEGER NOT NULL DEFAULT 0,
    "workedMin" INTEGER NOT NULL DEFAULT 0,
    "deltaMin" INTEGER NOT NULL DEFAULT 0,
    "firstIn" TIMESTAMP(3),
    "lastOut" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AttendanceDay_companyId_day_idx" ON "AttendanceDay"("companyId", "day");

-- CreateIndex
CREATE INDEX "AttendanceDay_employeeId_day_idx" ON "AttendanceDay"("employeeId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceDay_employeeId_day_key" ON "AttendanceDay"("employeeId", "day");

-- AddForeignKey
ALTER TABLE "AttendanceDay" ADD CONSTRAINT "AttendanceDay_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceDay" ADD CONSTRAINT "AttendanceDay_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
