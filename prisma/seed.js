const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  const now = new Date();

  const company = await prisma.company.upsert({
    where: { slug: "demo-bedrijf" },
    update: {},
    create: {
      name: "Demo Bedrijf",
      slug: "demo-bedrijf",
      contactEmail: "demo@bedrijf.be",
      subscriptionNumber: "SUB-DEMO-000001",
      subscriptionStatus: "TRIAL",
      trialStartsAt: now,
      trialEndsAt: addDays(now, 15),
    },
  });

  const employee = await prisma.employee.upsert({
    where: { pairCode: "DEMO01" },
    update: {
      companyId: company.id,
      name: "Demo Werknemer",
      active: true,
    },
    create: {
      companyId: company.id,
      name: "Demo Werknemer",
      pairCode: "DEMO01",
      active: true,
    },
  });

  const inTag = await prisma.scanTag.upsert({
    where: {
      companyId_direction: {
        companyId: company.id,
        direction: "IN",
      },
    },
    update: {},
    create: {
      companyId: company.id,
      direction: "IN",
      secret: "demo-in-secret",
    },
  });

  const outTag = await prisma.scanTag.upsert({
    where: {
      companyId_direction: {
        companyId: company.id,
        direction: "OUT",
      },
    },
    update: {},
    create: {
      companyId: company.id,
      direction: "OUT",
      secret: "demo-out-secret",
    },
  });

  await prisma.scanEvent.createMany({
    data: [
      {
        companyId: company.id,
        employeeId: employee.id,
        scanTagId: inTag.id,
        type: "IN",
        scannedAt: new Date(),
      },
      {
        companyId: company.id,
        employeeId: employee.id,
        scanTagId: outTag.id,
        type: "OUT",
        scannedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed voltooid");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });