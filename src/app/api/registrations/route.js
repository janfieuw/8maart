import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function jsonError(error, status = 400) {
  return NextResponse.json(
    {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    },
    { status }
  );
}

export async function GET(req) {
  try {
    const session = await getSession();

    if (!session?.companyId) {
      return jsonError("Niet ingelogd.", 401);
    }

    const companyId = session.companyId;

    const rows = await prisma.scanEvent.findMany({
      where: { companyId },
      orderBy: { scannedAt: "desc" },
      take: 5000,
      include: {
        employee: {
          select: {
            name: true,
            pairCode: true,
          },
        },
        scanTag: {
          select: {
            direction: true,
            secret: true,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, rows });
  } catch (error) {
    console.error(error);
    return jsonError("Failed to load registrations", 500);
  }
}