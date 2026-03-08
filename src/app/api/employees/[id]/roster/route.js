import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDemoCompanyId } from "@/lib/demo-company";

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

function normalizeId(params) {
  const raw = params?.id;
  return Array.isArray(raw) ? raw[0] : raw;
}

export async function PUT(req, context) {
  try {
    const companyId = await getDemoCompanyId();
    const params = await context.params;
    const employeeId = normalizeId(params);

    if (!employeeId) {
      return jsonError("Missing employee id", 400);
    }

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
      select: { id: true },
    });

    if (!employee) {
      return jsonError("Employee not found", 404);
    }

    const body = await req.json();
    const days = Array.isArray(body?.days) ? body.days : [];

    await prisma.$transaction([
      prisma.employeeRosterDay.deleteMany({
        where: { employeeId },
      }),
      prisma.employeeRosterDay.createMany({
        data: days.map((day) => ({
          employeeId,
          weekday: Number(day.weekday),
          expectedMinutes: Number(day.expectedMinutes || 0),
        })),
      }),
    ]);

    const rosterDays = await prisma.employeeRosterDay.findMany({
      where: { employeeId },
      orderBy: { weekday: "asc" },
    });

    return jsonOk({ rosterDays });
  } catch (error) {
    console.error("PUT /api/employees/[id]/roster error:", error);
    return jsonError("Failed to save roster", 500);
  }
}