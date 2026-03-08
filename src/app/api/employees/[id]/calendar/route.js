import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function jsonOk(data, init) {
  return NextResponse.json({ ok: true, ...data }, init);
}
function jsonErr(error, init) {
  return NextResponse.json({ ok: false, error }, init);
}

async function getEmployeeId(context) {
  const params = await context?.params;
  return params?.id ?? null;
}

function parseDateOnly(str) {
  if (!str || typeof str !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;

  const d = new Date(str + "T00:00:00.000Z");
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export async function GET(req, context) {
  try {
    const employeeId = await getEmployeeId(context);
    if (!employeeId) return jsonErr("Missing employee id", { status: 400 });

    const { searchParams } = new URL(req.url);
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");

    const from = parseDateOnly(fromStr);
    const to = parseDateOnly(toStr);

    if (!from || !to) {
      return jsonErr("Invalid from/to (YYYY-MM-DD required)", { status: 400 });
    }

    const rows = await prisma.employeeCalendarDay.findMany({
      where: {
        employeeId,
        date: { gte: from, lte: to },
      },
      select: { id: true, date: true, expectedMinutes: true },
      orderBy: { date: "asc" },
      take: 1000,
    });

    return jsonOk({ rows });
  } catch (e) {
    return jsonErr(e?.message || "Failed to load calendar", { status: 500 });
  }
}

export async function POST(req, context) {
  try {
    const employeeId = await getEmployeeId(context);
    if (!employeeId) return jsonErr("Missing employee id", { status: 400 });

    const body = await req.json();
    const dateStr = body?.date;
    const expectedMinutes = Number(body?.expectedMinutes);

    const date = parseDateOnly(dateStr);
    if (!date) return jsonErr("Invalid date (YYYY-MM-DD)", { status: 400 });

    if (!Number.isFinite(expectedMinutes) || expectedMinutes < 0) {
      return jsonErr("Invalid expectedMinutes (>= 0)", { status: 400 });
    }

    const row = await prisma.employeeCalendarDay.upsert({
      where: { employeeId_date: { employeeId, date } },
      update: { expectedMinutes: Math.round(expectedMinutes) },
      create: { employeeId, date, expectedMinutes: Math.round(expectedMinutes) },
      select: { id: true, date: true, expectedMinutes: true },
    });

    return jsonOk({ row }, { status: 201 });
  } catch (e) {
    return jsonErr(e?.message || "Failed to save calendar day", { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const employeeId = await getEmployeeId(context);
    if (!employeeId) return jsonErr("Missing employee id", { status: 400 });

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    const date = parseDateOnly(dateStr);

    if (!date) return jsonErr("Invalid date (YYYY-MM-DD)", { status: 400 });

    await prisma.employeeCalendarDay.delete({
      where: { employeeId_date: { employeeId, date } },
    });

    return jsonOk({ ok: true });
  } catch (e) {
    return jsonErr(e?.message || "Failed to delete calendar day", { status: 500 });
  }
}