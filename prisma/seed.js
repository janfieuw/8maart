import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const employee = await prisma.employee.upsert({
    where: { pairCode: "ABC123" },
    update: {
      name: "Demo Werknemer",
      active: true,
      expectedMode: "ROSTER",
    },
    create: {
      name: "Demo Werknemer",
      pairCode: "ABC123",
      active: true,
      expectedMode: "ROSTER",
    },
  });

  const roster = [
    { weekday: 1, expectedMinutes: 480 },
    { weekday: 2, expectedMinutes: 480 },
    { weekday: 3, expectedMinutes: 480 },
    { weekday: 4, expectedMinutes: 480 },
    { weekday: 5, expectedMinutes: 480 },
  ];

  for (const day of roster) {
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

  let scanLocation = await prisma.scanLocation.findFirst({
    where: {
      name: "Werkplaats",
      location: "Poort 3",
    },
  });

  if (!scanLocation) {
    scanLocation = await prisma.scanLocation.create({
      data: {
        name: "Werkplaats",
        location: "Poort 3",
      },
    });
  }

  await prisma.scanTag.upsert({
    where: { secret: "DEMO-IN" },
    update: {
      scanLocationId: scanLocation.id,
      direction: "IN",
    },
    create: {
      scanLocationId: scanLocation.id,
      secret: "DEMO-IN",
      direction: "IN",
    },
  });

  await prisma.scanTag.upsert({
    where: { secret: "DEMO-OUT" },
    update: {
      scanLocationId: scanLocation.id,
      direction: "OUT",
    },
    create: {
      scanLocationId: scanLocation.id,
      secret: "DEMO-OUT",
      direction: "OUT",
    },
  });

  console.log("Seed OK ✅", {
    employeeId: employee.id,
    scanLocationId: scanLocation.id,
    inSecret: "DEMO-IN",
    outSecret: "DEMO-OUT",
  });
}

main()
  .catch((e) => {
    console.error("Seed ERROR ❌");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });