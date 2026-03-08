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

export async function GET(_req, context) {
  try {
    const companyId = await getDemoCompanyId();
    const params = await context.params;
    const id = normalizeId(params);

    if (!id) {
      return jsonError("Missing employee id", 400);
    }

    const employee = await prisma.employee.findFirst({
      where: { id, companyId },
      include: {
        rosterDays: {
          orderBy: { weekday: "asc" },
        },
        calendarDays: {
          orderBy: { date: "asc" },
        },
      },
    });

    if (!employee) {
      return jsonError("Employee not found", 404);
    }

    return jsonOk({ employee });
  } catch (error) {
    console.error("GET /api/employees/[id] error:", error);
    return jsonError("Failed to load employee", 500);
  }
}

export async function PATCH(req, context) {
  try {
    const companyId = await getDemoCompanyId();
    const params = await context.params;
    const id = normalizeId(params);

    if (!id) {
      return jsonError("Missing employee id", 400);
    }

    const existing = await prisma.employee.findFirst({
      where: { id, companyId },
      select: { id: true },
    });

    if (!existing) {
      return jsonError("Employee not found", 404);
    }

    const body = await req.json();
    const data = {};

    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (!name) {
        return jsonError("Name is required", 400);
      }
      data.name = name;
    }

    if (typeof body.pairCode === "string") {
      const pairCode = body.pairCode.trim();
      if (!pairCode) {
        return jsonError("PairCode is required", 400);
      }
      data.pairCode = pairCode;
    }

    if (typeof body.expectedMode === "string") {
      const expectedMode = body.expectedMode.trim().toUpperCase();
      if (!["ROSTER", "CALENDAR"].includes(expectedMode)) {
        return jsonError("Invalid expectedMode", 400);
      }
      data.expectedMode = expectedMode;
    }

    if (typeof body.active === "boolean") {
      data.active = body.active;
    }

    const employee = await prisma.employee.update({
      where: { id },
      data,
      include: {
        rosterDays: {
          orderBy: { weekday: "asc" },
        },
        calendarDays: {
          orderBy: { date: "asc" },
        },
      },
    });

    return jsonOk({ employee });
  } catch (error) {
    console.error("PATCH /api/employees/[id] error:", error);

    if (error?.code === "P2002") {
      return jsonError("PairCode bestaat al", 409);
    }

    return jsonError("Failed to update employee", 500);
  }
}

export async function DELETE(_req, context) {
  try {
    const companyId = await getDemoCompanyId();
    const params = await context.params;
    const id = normalizeId(params);

    if (!id) {
      return jsonError("Missing employee id", 400);
    }

    const existing = await prisma.employee.findFirst({
      where: { id, companyId },
      select: { id: true },
    });

    if (!existing) {
      return jsonError("Employee not found", 404);
    }

    await prisma.employee.delete({
      where: { id },
    });

    return jsonOk({ deleted: true });
  } catch (error) {
    console.error("DELETE /api/employees/[id] error:", error);
    return jsonError("Failed to delete employee", 500);
  }
}