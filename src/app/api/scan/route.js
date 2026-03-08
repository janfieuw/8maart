import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function jsonOk(data, init) {
  return NextResponse.json({ ok: true, ...data }, init);
}

function jsonErr(error, init) {
  return NextResponse.json({ ok: false, error }, init);
}

export async function POST(req) {
  try {
    const body = await req.json();

    const secret = String(body?.secret || "").trim();
    const pairCode = String(body?.pairCode || "").trim();

    if (!secret) return jsonErr("Secret is required", { status: 400 });
    if (!pairCode) return jsonErr("PairCode is required", { status: 400 });

    const scanTag = await prisma.scanTag.findUnique({
      where: { secret },
      select: {
        id: true,
        secret: true,
        direction: true,
        scanLocation: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
    });

    if (!scanTag) {
      return jsonErr("ScanTag niet gevonden", { status: 404 });
    }

    const employee = await prisma.employee.findUnique({
      where: { pairCode },
      select: {
        id: true,
        name: true,
        pairCode: true,
        active: true,
      },
    });

    if (!employee) {
      return jsonErr("PairCode onbekend", { status: 404 });
    }

    if (!employee.active) {
      return jsonErr("Werknemer is niet actief", { status: 400 });
    }

    const row = await prisma.scanEvent.create({
      data: {
        employeeId: employee.id,
        scanTagId: scanTag.id,
        type: scanTag.direction,
      },
      select: {
        id: true,
        type: true,
        scannedAt: true,
      },
    });

    return jsonOk({
      row,
      type: row.type,
      employeeName: employee.name,
      pairCode: employee.pairCode,
      tagName: scanTag.scanLocation.name,
      location: scanTag.scanLocation.location,
      scannedAt: row.scannedAt,
    });
  } catch (e) {
    return jsonErr(e?.message || "Scan failed", { status: 500 });
  }
}