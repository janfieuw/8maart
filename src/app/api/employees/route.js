import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function jsonOk(data) {
  return NextResponse.json({ ok: true, ...data });
}

function jsonErr(error, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function GET() {
  try {
    const rows = await prisma.employee.findMany({
      orderBy: { name: "asc" },
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
  } catch (e) {
    console.error(e);
    return jsonErr("Failed to load employees", 500);
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const name = String(body.name || "").trim();
    const pairCode = String(body.pairCode || "").trim();

    if (!name) {
      return jsonErr("Naam is verplicht");
    }

    if (!pairCode) {
      return jsonErr("PairCode is verplicht");
    }

    const employee = await prisma.employee.create({
      data: {
        name,
        pairCode,
        active: body.active ?? true,
        expectedMode: body.expectedMode ?? "ROSTER",
      },
    });

    return jsonOk({ employee });
  } catch (e) {
    console.error(e);

    if (e.code === "P2002") {
      return jsonErr("PairCode bestaat al");
    }

    return jsonErr("Employee create failed", 500);
  }
}