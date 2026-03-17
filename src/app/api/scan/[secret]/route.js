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

export async function POST(request, context) {
  try {
    const params = await context.params;
    const secret = String(params?.secret || "").trim();

    if (!secret) {
      return jsonError("Secret ontbreekt", 400);
    }

    const body = await request.json().catch(() => ({}));
    const pairCode = normalizePairCode(body?.pairCode);
    const deviceToken = String(body?.deviceToken || "").trim();

    // 🔍 1. Tag ophalen
    const tag = await prisma.scanTag.findUnique({
      where: { secret },
    });

    if (!tag) {
      return jsonError("Tag niet gevonden", 404);
    }

    const companyId = tag.companyId;

    let employee = null;

    // ✅ 2. PRIMARY: via device (BELANGRIJKSTE FLOW)
    if (deviceToken) {
      const device = await prisma.device.findUnique({
        where: { deviceToken },
        include: {
          employee: true,
        },
      });

      if (device?.employee?.active) {
        employee = device.employee;
      }
    }

    // ✅ 3. FALLBACK: via pairCode (voor eerste scan of debugging)
    if (!employee && pairCode) {
      employee = await prisma.employee.findFirst({
        where: {
          companyId,
          pairCode,
          active: true,
        },
      });
    }

    // ❌ 4. Geen employee gevonden
    if (!employee) {
      return jsonError(
        "Werknemer niet gevonden of toestel niet gekoppeld",
        404
      );
    }

    // ✅ 5. Scan registreren
    const scanEvent = await prisma.scanEvent.create({
      data: {
        companyId: employee.companyId, // 🔥 belangrijk: van employee, niet tag
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
    });
  } catch (error) {
    console.error("POST /api/scan/[secret] error:", error);
    return jsonError("Scan mislukt", 500);
  }
}