import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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
  const session = await getSession();

  if (session?.companyId) {
    return session.companyId;
  }

  const company = await getDemoCompany();
  return company.id;
}