import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDemoCompanyId } from "@/lib/demo-company";

function jsonOk(data = {}, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

function jsonError(error, status = 400) {
  return NextResponse.json(
    {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    },
    { status }
  );
}

export async function GET() {
  try {
    const companyId = await getDemoCompanyId();

    const rows = await prisma.scanEvent.findMany({
      where: { companyId },
      orderBy: { scannedAt: "desc" },
      take: 500,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            pairCode: true,
          },
        },
        scanTag: true,
      },
    });

    return jsonOk({ rows });
  } catch (error) {
    console.error("GET /api/registrations error:", error);
    return jsonError("Failed to load registrations", 500);
  }
}