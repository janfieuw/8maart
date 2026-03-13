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

    const rows = await prisma.employee.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        pairCode: true,
        active: true,
        expectedMode: true,
        createdAt: true,
      },
    });

    return jsonOk({ rows });
  } catch (error) {
    console.error("GET /api/employees error:", error);
    return jsonError("Failed to load employees", 500);
  }
}

export async function POST(req) {
  try {
    const companyId = await getDemoCompanyId();
    const body = await req.json();

    const name = String(body?.name || "").trim();
    const pairCode = String(body?.pairCode || "").trim();

    let expectedMode = body?.expectedMode ?? null;

    if (expectedMode != null && expectedMode !== "") {
      expectedMode = String(expectedMode).toUpperCase();

      if (!["ROSTER", "CALENDAR"].includes(expectedMode)) {
        return jsonError("Invalid expectedMode", 400);
      }
    } else {
      expectedMode = null;
    }

    if (!name) {
      return jsonError("Naam is verplicht", 400);
    }

    if (!pairCode) {
      return jsonError("PairCode is verplicht", 400);
    }

    const employee = await prisma.employee.create({
      data: {
        companyId,
        name,
        pairCode,
        expectedMode,
        active: true,
      },
    });

    return jsonOk({ employee }, 201);
  } catch (error) {
    console.error("POST /api/employees error:", error);

    if (error?.code === "P2002") {
      return jsonError("PairCode bestaat al", 409);
    }

    return jsonError("Failed to create employee", 500);
  }
}