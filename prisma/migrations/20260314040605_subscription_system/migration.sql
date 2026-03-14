-- CreateEnum
CREATE TYPE "ExpectedMode" AS ENUM ('ROSTER', 'CALENDAR');

-- CreateEnum
CREATE TYPE "ScanDirection" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "ScanType" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "vatNumber" TEXT,
    "phone" TEXT,
    "billingStreet" TEXT,
    "billingHouseNumber" TEXT,
    "billingPostalCode" TEXT,
    "billingCity" TEXT,
    "billingCountry" TEXT,
    "shippingStreet" TEXT,
    "shippingHouseNumber" TEXT,
    "shippingPostalCode" TEXT,
    "shippingCity" TEXT,
    "shippingCountry" TEXT,
    "contactEmail" TEXT,
    "subscriptionNumber" TEXT,
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "trialStartsAt" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "nextRenewalAt" TIMESTAMP(3),
    "deactivatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pairCode" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedMode" "ExpectedMode" NOT NULL DEFAULT 'ROSTER',

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "deviceToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeRosterDay" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "expectedMinutes" INTEGER NOT NULL,

    CONSTRAINT "EmployeeRosterDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeCalendarDay" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "expectedMinutes" INTEGER NOT NULL,

    CONSTRAINT "EmployeeCalendarDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanLocation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanTag" (
    "id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "direction" "ScanDirection" NOT NULL,
    "scanLocationId" TEXT NOT NULL,

    CONSTRAINT "ScanTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanEvent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "scanTagId" TEXT NOT NULL,
    "type" "ScanType" NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Company_subscriptionNumber_key" ON "Company"("subscriptionNumber");

-- CreateIndex
CREATE INDEX "Company_name_idx" ON "Company"("name");

-- CreateIndex
CREATE INDEX "Company_subscriptionStatus_idx" ON "Company"("subscriptionStatus");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_pairCode_key" ON "Employee"("pairCode");

-- CreateIndex
CREATE INDEX "Employee_companyId_idx" ON "Employee"("companyId");

-- CreateIndex
CREATE INDEX "Employee_name_idx" ON "Employee"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Device_deviceToken_key" ON "Device"("deviceToken");

-- CreateIndex
CREATE INDEX "Device_employeeId_idx" ON "Device"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeRosterDay_employeeId_idx" ON "EmployeeRosterDay"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeRosterDay_employeeId_weekday_key" ON "EmployeeRosterDay"("employeeId", "weekday");

-- CreateIndex
CREATE INDEX "EmployeeCalendarDay_employeeId_idx" ON "EmployeeCalendarDay"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeCalendarDay_employeeId_date_key" ON "EmployeeCalendarDay"("employeeId", "date");

-- CreateIndex
CREATE INDEX "ScanLocation_companyId_idx" ON "ScanLocation"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ScanLocation_companyId_name_key" ON "ScanLocation"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ScanTag_secret_key" ON "ScanTag"("secret");

-- CreateIndex
CREATE INDEX "ScanTag_scanLocationId_idx" ON "ScanTag"("scanLocationId");

-- CreateIndex
CREATE UNIQUE INDEX "ScanTag_scanLocationId_direction_key" ON "ScanTag"("scanLocationId", "direction");

-- CreateIndex
CREATE INDEX "ScanEvent_companyId_scannedAt_idx" ON "ScanEvent"("companyId", "scannedAt");

-- CreateIndex
CREATE INDEX "ScanEvent_employeeId_scannedAt_idx" ON "ScanEvent"("employeeId", "scannedAt");

-- CreateIndex
CREATE INDEX "ScanEvent_scanTagId_scannedAt_idx" ON "ScanEvent"("scanTagId", "scannedAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeRosterDay" ADD CONSTRAINT "EmployeeRosterDay_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeCalendarDay" ADD CONSTRAINT "EmployeeCalendarDay_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanLocation" ADD CONSTRAINT "ScanLocation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanTag" ADD CONSTRAINT "ScanTag_scanLocationId_fkey" FOREIGN KEY ("scanLocationId") REFERENCES "ScanLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanEvent" ADD CONSTRAINT "ScanEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanEvent" ADD CONSTRAINT "ScanEvent_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanEvent" ADD CONSTRAINT "ScanEvent_scanTagId_fkey" FOREIGN KEY ("scanTagId") REFERENCES "ScanTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
