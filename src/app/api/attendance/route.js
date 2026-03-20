import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function jsonOk(data, init) {
  return NextResponse.json({ ok: true, ...data }, init);
}

function jsonErr(error, init) {
  return NextResponse.json({ ok: false, error }, init);
}

function parseDateOnly(value) {
  if (!value || typeof value !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function formatDateOnlyUTC(date) {
  return date.toISOString().slice(0, 10);
}

function startOfDayUTC(dateStr) {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function endOfDayUTC(dateStr) {
  return new Date(`${dateStr}T23:59:59.999Z`);
}

export async function GET(req) {
  try {
    const session = await getSession();

    if (!session?.companyId) {
      return jsonErr("Niet ingelogd.", { status: 401 });
    }

    const companyId = session.companyId;
    const { searchParams } = new URL(req.url);

    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");

    const today = formatDateOnlyUTC(new Date());

    const from = parseDateOnly(fromStr || today);
    const to = parseDateOnly(toStr || today);

    if (!from || !to) {
      return jsonErr("Invalid from/to. Expected YYYY-MM-DD.", { status: 400 });
    }

    const fromDay = formatDateOnlyUTC(from);
    const toDay = formatDateOnlyUTC(to);

    if (fromDay > toDay) {
      return jsonErr("from must be <= to", { status: 400 });
    }

    const rangeStart = startOfDayUTC(fromDay);
    const rangeEnd = endOfDayUTC(toDay);

    const rows = await prisma.attendanceDay.findMany({
      where: {
        companyId,
        day: {
          gte: rangeStart,
          lte: rangeEnd,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            pairCode: true,
          },
        },
      },
      orderBy: [
        { day: "desc" },
        { employee: { name: "asc" } },
      ],
    });

    return jsonOk({
      rows: rows.map((row) => ({
        id: row.id,
        day: formatDateOnlyUTC(new Date(row.day)),
        employeeId: row.employeeId,
        employeeName: row.employee?.name || "",
        pairCode: row.employee?.pairCode || "",
        expectedMin: Number(row.expectedMin || 0),
        workedMin: Number(row.workedMin || 0),
        deltaMin: Number(row.deltaMin || 0),
        firstIn: row.firstIn ? new Date(row.firstIn).toISOString() : null,
        lastOut: row.lastOut ? new Date(row.lastOut).toISOString() : null,
      })),
    });
  } catch (e) {
    return jsonErr(e?.message || "Failed to load attendance", { status: 500 });
  }
}