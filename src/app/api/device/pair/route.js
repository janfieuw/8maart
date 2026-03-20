import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const body = await req.json().catch(() => ({}));

    const pairCode = normalizePairCode(body?.pairCode);
    const deviceToken = String(body?.deviceToken || "").trim();
    const secret = String(body?.secret || "").trim();

    if (!pairCode) {
      return jsonError("PairCode ontbreekt", 400);
    }

    if (!deviceToken) {
      return jsonError("DeviceToken ontbreekt", 400);
    }

    if (!secret) {
      return jsonError("Secret ontbreekt", 400);
    }

    const tag = await prisma.scanTag.findUnique({
      where: { secret },
    });

    if (!tag) {
      return jsonError("Tag niet gevonden", 404);
    }

    if (!tag.companyId) {
      return jsonError("Tag is ongeldig", 500);
    }

    const companyId = tag.companyId;

    const employee = await prisma.employee.findFirst({
      where: {
        companyId,
        pairCode,
        active: true,
      },
    });

    if (!employee) {
      return jsonError("Ongeldige PairCode", 404);
    }

    const existingDevice = await prisma.device.findUnique({
      where: { deviceToken },
      include: {
        employee: true,
      },
    });

    if (existingDevice && existingDevice.employee.companyId !== companyId) {
      await prisma.device.delete({
        where: { deviceToken },
      });
    }

    const device = await prisma.device.upsert({
      where: { deviceToken },
      update: {
        employeeId: employee.id,
      },
      create: {
        deviceToken,
        employeeId: employee.id,
      },
    });

    return jsonOk({
      message: "Toestel gekoppeld",
      device: {
        id: device.id,
        deviceToken: device.deviceToken,
      },
      employee: {
        id: employee.id,
        name: employee.name,
        pairCode: employee.pairCode,
      },
    });
  } catch (error) {
    console.error("POST /api/device/pair error:", error);
    return jsonError("Toestel koppelen mislukt", 500);
  }
}