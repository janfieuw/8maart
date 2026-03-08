import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import crypto from "crypto";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL ontbreekt in je environment.");
}

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function randomSecret() {
  return crypto.randomBytes(24).toString("hex");
}

async function main() {
  console.log("Seeding Punctoo...");

  const company = await prisma.company.upsert({
    where: { slug: "demo-bedrijf" },
    update: {
      name: "Demo Bedrijf",
      vatNumber: "BE0123456789",
      phone: "+32 470 00 00 00",
      billingStreet: "Stationsstraat",
      billingHouseNumber: "12",
      billingPostalCode: "9000",
      billingCity: "Gent",
      billingCountry: "België",
      shippingStreet: "Magazijnweg",
      shippingHouseNumber: "5",
      shippingPostalCode: "9000",
      shippingCity: "Gent",
      shippingCountry: "België",
    },
    create: {
      name: "Demo Bedrijf",
      slug: "demo-bedrijf",
      vatNumber: "BE0123456789",
      phone: "+32 470 00 00 00",
      billingStreet: "Stationsstraat",
      billingHouseNumber: "12",
      billingPostalCode: "9000",
      billingCity: "Gent",
      billingCountry: "België",
      shippingStreet: "Magazijnweg",
      shippingHouseNumber: "5",
      shippingPostalCode: "9000",
      shippingCity: "Gent",
      shippingCountry: "België",
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "demo@punctoo.local" },
    update: {
      companyId: company.id,
      name: "Demo Admin",
      passwordHash: "demo-not-secure-change-me",
    },
    create: {
      companyId: company.id,
      email: "demo@punctoo.local",
      name: "Demo Admin",
      passwordHash: "demo-not-secure-change-me",
    },
  });

  const employee = await prisma.employee.upsert({
    where: { pairCode: "ABC123" },
    update: {
      companyId: company.id,
      name: "Demo Werknemer",
      active: true,
      expectedMode: "ROSTER",
    },
    create: {
      companyId: company.id,
      name: "Demo Werknemer",
      pairCode: "ABC123",
      active: true,
      expectedMode: "ROSTER",
    },
  });

  const rosterDays = [
    { weekday: 1, expectedMinutes: 480 },
    { weekday: 2, expectedMinutes: 480 },
    { weekday: 3, expectedMinutes: 480 },
    { weekday: 4, expectedMinutes: 480 },
    { weekday: 5, expectedMinutes: 480 },
    { weekday: 6, expectedMinutes: 0 },
    { weekday: 7, expectedMinutes: 0 },
  ];

  for (const day of rosterDays) {
    await prisma.employeeRosterDay.upsert({
      where: {
        employeeId_weekday: {
          employeeId: employee.id,
          weekday: day.weekday,
        },
      },
      update: {
        expectedMinutes: day.expectedMinutes,
      },
      create: {
        employeeId: employee.id,
        weekday: day.weekday,
        expectedMinutes: day.expectedMinutes,
      },
    });
  }

  const scanLocation = await prisma.scanLocation.upsert({
    where: {
      companyId_name: {
        companyId: company.id,
        name: "Werkplaats",
      },
    },
    update: {
      location: "Poort 3",
    },
    create: {
      companyId: company.id,
      name: "Werkplaats",
      location: "Poort 3",
    },
  });

  const existingTags = await prisma.scanTag.findMany({
    where: { scanLocationId: scanLocation.id },
  });

  const inTag = existingTags.find((tag) => tag.direction === "IN");
  const outTag = existingTags.find((tag) => tag.direction === "OUT");

  if (!inTag) {
    await prisma.scanTag.create({
      data: {
        scanLocationId: scanLocation.id,
        direction: "IN",
        secret: "DEMO-IN",
      },
    });
  }

  if (!outTag) {
    await prisma.scanTag.create({
      data: {
        scanLocationId: scanLocation.id,
        direction: "OUT",
        secret: "DEMO-OUT",
      },
    });
  }

  console.log("Seed klaar.");
  console.log("Company:", company.name, `(${company.slug})`);
  console.log("User:", user.email);
  console.log("Employee:", `${employee.name} / ${employee.pairCode}`);
  console.log("Demo scan secrets: DEMO-IN / DEMO-OUT");
}

main()
  .catch((e) => {
    console.error("Seed fout:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });