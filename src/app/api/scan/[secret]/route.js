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

export async function POST(request, { params }) {
  try {
    const secret = String(params?.secret || "").trim();

    if (!secret) {
      return jsonError("Secret ontbreekt", 400);
    }

    const body = await request.json().catch(() => ({}));
    const pairCode = normalizePairCode(body?.pairCode);
    const deviceToken = String(body?.deviceToken || "").trim();

    const tag = await prisma.scanTag.findFirst({
      where: { secret },
      include: {
        scanLocation: true,
      },
    });

    if (!tag) {
      return jsonError("Tag niet gevonden", 404);
    }

    if (!tag.scanLocation?.companyId) {
      return jsonError("Scanlocatie is ongeldig", 500);
    }

    const companyId = tag.scanLocation.companyId;

    let employee = null;

    if (deviceToken) {
      const device = await prisma.device.findUnique({
        where: { deviceToken },
        include: {
          employee: true,
        },
      });

      if (
        device?.employee?.active &&
        device.employee.companyId === companyId
      ) {
        employee = device.employee;
      }
    }

    if (!employee && pairCode) {
      employee = await prisma.employee.findFirst({
        where: {
          companyId,
          pairCode,
          active: true,
        },
      });
    }

    if (!employee) {
      return jsonError("Werknemer niet gevonden of toestel niet gekoppeld", 404);
    }

    const scanEvent = await prisma.scanEvent.create({
      data: {
        companyId,
        employeeId: employee.id,
        scanTagId: tag.id,
        type: tag.direction,
      },
    });

    return jsonOk({
      message: "Scan geregistreerd",
      type: tag.direction,
      scannedAt: scanEvent.scannedAt,
      employee: {
        id: employee.id,
        name: employee.name,
        pairCode: employee.pairCode,
      },
      scanLocation: {
        id: tag.scanLocation.id,
        name: tag.scanLocation.name,
        location: tag.scanLocation.location,
      },
      scanEvent,
    });
  } catch (error) {
    console.error("POST /api/scan/[secret] error:", error);
    return jsonError("Scan mislukt", 500);
  }
}