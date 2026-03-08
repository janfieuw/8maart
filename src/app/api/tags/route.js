import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function jsonOk(data = {}, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

function randomSecret() {
  return crypto.randomBytes(24).toString("hex");
}

export async function POST(req) {
  try {
    const body = await req.json();

    const scanLocationId = body.scanLocationId;
    const direction = body.direction;

    const tag = await prisma.scanTag.create({
      data: {
        scanLocationId,
        direction,
        secret: randomSecret(),
      },
    });

    return jsonOk({ tag });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Failed to create tag" }, { status: 500 });
  }
}