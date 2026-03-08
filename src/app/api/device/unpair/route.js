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

export async function POST(req) {
  try {
    const body = await req.json();
    const deviceToken = String(body?.deviceToken || "").trim();

    if (!deviceToken) {
      return jsonError("deviceToken ontbreekt", 400);
    }

    await prisma.device.deleteMany({
      where: { deviceToken },
    });

    return jsonOk({ unpaired: true });
  } catch (error) {
    console.error("POST /api/device/unpair error:", error);
    return jsonError("Toestel ontkoppelen mislukt", 500);
  }
}