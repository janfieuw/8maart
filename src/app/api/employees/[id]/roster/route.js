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

export async function GET(_req, context) {
  try {
    const employeeId = await getEmployeeId(context);
    if (!employeeId) return jsonErr("Missing employee id", { status: 400 });

    const rows = await prisma.employeeRosterDay.findMany({
      where: { employeeId },
      select: { id: true, weekday: true, expectedMinutes: true },
      orderBy: { weekday: "asc" },
    });

    const map = new Map(rows.map((r) => [r.weekday, r.expectedMinutes]));
    const days = Array.from({ length: 7 }).map((_, weekday) => ({
      employeeId,
      weekday,
      expectedMinutes: map.get(weekday) ?? 0,
    }));

    return jsonOk({ days });
  } catch (e) {
    return jsonErr(e?.message || "Failed to load roster", { status: 500 });
  }
}

export async function PUT(req, context) {
  try {
    const employeeId = await getEmployeeId(context);
    if (!employeeId) return jsonErr("Missing employee id", { status: 400 });

    const body = await req.json();
    const days = body?.days;

    if (!Array.isArray(days)) {
      return jsonErr("days must be an array", { status: 400 });
    }

    const normalized = days.map((d) => {
      const weekday = Number(d.weekday);
      const expectedMinutes = Number(d.expectedMinutes);

      if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
        throw new Error("Invalid weekday (0..6)");
      }
      if (!Number.isFinite(expectedMinutes) || expectedMinutes < 0) {
        throw new Error("Invalid expectedMinutes (>= 0)");
      }

      return { weekday, expectedMinutes: Math.round(expectedMinutes) };
    });

    await prisma.$transaction(
      normalized.map((d) =>
        prisma.employeeRosterDay.upsert({
          where: { employeeId_weekday: { employeeId, weekday: d.weekday } },
          update: { expectedMinutes: d.expectedMinutes },
          create: { employeeId, weekday: d.weekday, expectedMinutes: d.expectedMinutes },
        })
      )
    );

    return jsonOk({ ok: true });
  } catch (e) {
    return jsonErr(e?.message || "Failed to save roster", { status: 500 });
  }
}