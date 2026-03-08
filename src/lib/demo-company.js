import { prisma } from "@/lib/prisma";

export async function getDemoCompany() {
  const company = await prisma.company.findUnique({
    where: { slug: "demo-bedrijf" },
  });

  if (!company) {
    throw new Error("Demo company niet gevonden. Run eerst: npx prisma db seed");
  }

  return company;
}

export async function getDemoCompanyId() {
  const company = await getDemoCompany();
  return company.id;
}