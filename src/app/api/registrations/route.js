import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function jsonOk(data, init) {
  return NextResponse.json({ ok: true, ...data }, init);
}

function jsonErr(error, init) {
  return NextResponse.json({ ok: false, error }, init);
}

export async function GET() {
  try {
    const rows = await prisma.scanEvent.findMany({
      orderBy: { scannedAt: "desc" },
      take: 200,
      select: {
        id: true,
        type: true,
        scannedAt: true,
        employee: {
          select: {
            id: true,
            name: true,
            pairCode: true,
          },
        },
        scanTag: {
          select: {
            id: true,
            direction: true,
            scanLocation: {
              select: {
                id: true,
                name: true,
                location: true,
              },
            },
          },
        },
      },
    });

    return jsonOk({ rows });
  } catch (e) {
    return jsonErr(e?.message || "Failed to load registrations", { status: 500 });
  }
}