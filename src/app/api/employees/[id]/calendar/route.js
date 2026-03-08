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

function normalizeDateOnly(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error("Invalid date");
  }
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function POST(req, context) {
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
    const date = normalizeDateOnly(body?.date);
    const expectedMinutes = Number(body?.expectedMinutes || 0);

    const calendarDay = await prisma.employeeCalendarDay.upsert({
      where: {
        employeeId_date: {
          employeeId,
          date,
        },
      },
      update: {
        expectedMinutes,
      },
      create: {
        employeeId,
        date,
        expectedMinutes,
      },
    });

    return jsonOk({ calendarDay });
  } catch (error) {
    console.error("POST /api/employees/[id]/calendar error:", error);
    return jsonError("Failed to save calendar day", 500);
  }
}

export async function DELETE(req, context) {
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

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");

    if (!dateParam) {
      return jsonError("Missing date", 400);
    }

    const date = normalizeDateOnly(dateParam);

    await prisma.employeeCalendarDay.deleteMany({
      where: {
        employeeId,
        date,
      },
    });

    return jsonOk({ deleted: true });
  } catch (error) {
    console.error("DELETE /api/employees/[id]/calendar error:", error);
    return jsonError("Failed to delete calendar day", 500);
  }
}