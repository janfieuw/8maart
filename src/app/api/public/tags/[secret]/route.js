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

export async function GET(_req, context) {
  try {
    const params = await context.params;
    const secret = String(params?.secret || "").trim();

    if (!secret) {
      return jsonError("Secret ontbreekt", 400);
    }

    const scanTag = await prisma.scanTag.findUnique({
      where: { secret },
      include: {
        scanLocation: true,
      },
    });

    if (!scanTag) {
      return jsonError("QR-code niet gevonden", 404);
    }

    return jsonOk({ scanTag });
  } catch (error) {
    console.error("GET /api/public/tags/[secret] error:", error);
    return jsonError("QR-code laden mislukt", 500);
  }
}