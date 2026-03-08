import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

function jsonOk(data, init) {
  return NextResponse.json({ ok: true, ...data }, init);
}

function jsonErr(error, init) {
  return NextResponse.json({ ok: false, error }, init);
}

function makeSecret() {
  return crypto.randomBytes(16).toString("hex");
}

export async function GET() {
  try {
    const rows = await prisma.scanLocation.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        location: true,
        createdAt: true,
        scanTags: {
          select: {
            id: true,
            secret: true,
            direction: true,
            createdAt: true,
          },
          orderBy: { direction: "asc" },
        },
      },
    });

    return jsonOk({ rows });
  } catch (e) {
    return jsonErr(e?.message || "Failed to load scan locations", { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const name = String(body?.name || "").trim();
    const location = String(body?.location || "").trim();

    if (!name) return jsonErr("Naam is verplicht", { status: 400 });

    const row = await prisma.$transaction(async (tx) => {
      const scanLocation = await tx.scanLocation.create({
        data: {
          name,
          location: location || null,
        },
      });

      await tx.scanTag.createMany({
        data: [
          {
            scanLocationId: scanLocation.id,
            secret: makeSecret(),
            direction: "IN",
          },
          {
            scanLocationId: scanLocation.id,
            secret: makeSecret(),
            direction: "OUT",
          },
        ],
      });

      return tx.scanLocation.findUnique({
        where: { id: scanLocation.id },
        select: {
          id: true,
          name: true,
          location: true,
          createdAt: true,
          scanTags: {
            select: {
              id: true,
              secret: true,
              direction: true,
              createdAt: true,
            },
            orderBy: { direction: "asc" },
          },
        },
      });
    });

    return jsonOk({ row }, { status: 201 });
  } catch (e) {
    return jsonErr(e?.message || "Failed to create scan location", { status: 500 });
  }
}