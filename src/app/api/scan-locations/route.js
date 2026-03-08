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

    const rows = await prisma.scanLocation.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      include: {
        scanTags: {
          orderBy: { direction: "asc" },
        },
      },
    });

    return jsonOk({ rows });
  } catch (error) {
    console.error("GET /api/scan-locations error:", error);
    return jsonError("Failed to load locations", 500);
  }
}

export async function POST(req) {
  try {
    const companyId = await getDemoCompanyId();
    const body = await req.json();

    const name = String(body?.name || "").trim();
    const location = String(body?.location || "").trim() || null;

    if (!name) {
      return jsonError("Naam is verplicht", 400);
    }

    const scanLocation = await prisma.scanLocation.create({
      data: {
        companyId,
        name,
        location,
      },
    });

    return jsonOk({ scanLocation }, 201);
  } catch (error) {
    console.error("POST /api/scan-locations error:", error);

    if (error?.code === "P2002") {
      return jsonError("Scanlocatie bestaat al", 409);
    }

    return jsonError("Failed to create location", 500);
  }
}