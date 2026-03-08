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

function normalizePairCode(code) {
  return String(code || "").trim().toUpperCase();
}

export async function POST(req) {
  try {
    const companyId = await getDemoCompanyId();
    const body = await req.json();

    const pairCode = normalizePairCode(body?.pairCode);
    const deviceToken = String(body?.deviceToken || "").trim();

    if (!pairCode) {
      return jsonError("PairCode ontbreekt", 400);
    }

    if (!deviceToken) {
      return jsonError("deviceToken ontbreekt", 400);
    }

    const employee = await prisma.employee.findFirst({
      where: {
        companyId,
        pairCode,
        active: true,
      },
      select: {
        id: true,
        name: true,
        pairCode: true,
      },
    });

    if (!employee) {
      return jsonError("Werknemer niet gevonden", 404);
    }

    const device = await prisma.device.upsert({
      where: { deviceToken },
      update: {
        employeeId: employee.id,
      },
      create: {
        employeeId: employee.id,
        deviceToken,
      },
    });

    return jsonOk({
      device,
      employee,
      paired: true,
    });
  } catch (error) {
    console.error("POST /api/device/pair error:", error);
    return jsonError("Toestel koppelen mislukt", 500);
  }
}