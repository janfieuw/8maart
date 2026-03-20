import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

function normalizePairCode(code) {
  return String(code || "").trim().toUpperCase();
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

function minutesBetween(a, b) {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));
}

function computeWorkedFromEvents(events) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.scannedAt).getTime() - new Date(b.scannedAt).getTime()
  );

  let workedMin = 0;
  let firstIn = null;
  let lastOut = null;
  let openIn = null;

  for (const ev of sorted) {
    const ts = new Date(ev.scannedAt);
    if (Number.isNaN(ts.getTime())) continue;

    if (ev.type === "IN") {
      if (!firstIn) firstIn = ts;
      if (!openIn) openIn = ts;
      continue;
    }

    if (ev.type === "OUT") {
      lastOut = ts;

      if (openIn) {
        workedMin += minutesBetween(openIn, ts);
        openIn = null;
      }
    }
  }

  return {
    workedMin,
    firstIn,
    lastOut,
  };
}

// 1 = maandag ... 7 = zondag
function getRosterWeekdayIndex(dayStr) {
  const jsWeekday = startOfDayUTC(dayStr).getUTCDay();
  return jsWeekday === 0 ? 7 : jsWeekday;
}

function computeExpectedMinutes(employee, dayStr) {
  if (!employee) return 0;

  const mode = String(employee.expectedMode || "").toUpperCase();

  if (!mode) return 0;

  if (mode === "ROSTER") {
    if (!Array.isArray(employee.rosterDays) || employee.rosterDays.length === 0) {
      return 0;
    }

    const weekday = getRosterWeekdayIndex(dayStr);

    const roster = employee.rosterDays.find(
      (r) => Number(r.weekday) === weekday
    );

    return Number(roster?.expectedMinutes || 0);
  }

  if (mode === "CALENDAR") {
    if (!Array.isArray(employee.calendarDays) || employee.calendarDays.length === 0) {
      return 0;
    }

    const calendar = employee.calendarDays.find((c) => {
      const cDay = formatDateOnlyUTC(new Date(c.date));
      return cDay === dayStr;
    });

    return Number(calendar?.expectedMinutes || 0);
  }

  return 0;
}

async function upsertAttendanceDay(employee, scannedAt) {
  const dayStr = formatDateOnlyUTC(new Date(scannedAt));
  const dayDate = startOfDayUTC(dayStr);

  const dayEvents = await prisma.scanEvent.findMany({
    where: {
      companyId: employee.companyId,
      employeeId: employee.id,
      scannedAt: {
        gte: startOfDayUTC(dayStr),
        lte: endOfDayUTC(dayStr),
      },
    },
    orderBy: [{ scannedAt: "asc" }],
    select: {
      type: true,
      scannedAt: true,
    },
  });

  const worked = computeWorkedFromEvents(dayEvents);

  const existingAttendanceDay = await prisma.attendanceDay.findUnique({
    where: {
      employeeId_day: {
        employeeId: employee.id,
        day: dayDate,
      },
    },
    select: {
      expectedMin: true,
    },
  });

  let expectedMin = 0;

  if (existingAttendanceDay) {
    expectedMin = Number(existingAttendanceDay.expectedMin || 0);
  } else {
    const fullEmployee = await prisma.employee.findUnique({
      where: {
        id: employee.id,
      },
      select: {
        id: true,
        companyId: true,
        expectedMode: true,
        rosterDays: {
          select: {
            weekday: true,
            expectedMinutes: true,
          },
          orderBy: {
            weekday: "asc",
          },
        },
        calendarDays: {
          where: {
            date: {
              gte: startOfDayUTC(dayStr),
              lte: endOfDayUTC(dayStr),
            },
          },
          select: {
            date: true,
            expectedMinutes: true,
          },
        },
      },
    });

    expectedMin = computeExpectedMinutes(fullEmployee, dayStr);
  }

  await prisma.attendanceDay.upsert({
    where: {
      employeeId_day: {
        employeeId: employee.id,
        day: dayDate,
      },
    },
    update: {
      workedMin: worked.workedMin,
      deltaMin: worked.workedMin - expectedMin,
      firstIn: worked.firstIn,
      lastOut: worked.lastOut,
    },
    create: {
      companyId: employee.companyId,
      employeeId: employee.id,
      day: dayDate,
      expectedMin,
      workedMin: worked.workedMin,
      deltaMin: worked.workedMin - expectedMin,
      firstIn: worked.firstIn,
      lastOut: worked.lastOut,
    },
  });
}

export async function POST(request, context) {
  try {
    const params = await context.params;
    const secret = String(params?.secret || "").trim();

    if (!secret) {
      return jsonError("Secret ontbreekt", 400);
    }

    const body = await request.json().catch(() => ({}));
    const pairCode = normalizePairCode(body?.pairCode);
    const deviceToken = String(body?.deviceToken || "").trim();

    const tag = await prisma.scanTag.findUnique({
      where: { secret },
    });

    if (!tag) {
      return jsonError("Tag niet gevonden", 404);
    }

    const companyId = tag.companyId;

    let employee = null;

    if (deviceToken) {
      const device = await prisma.device.findUnique({
        where: { deviceToken },
        include: {
          employee: true,
        },
      });

      if (device?.employee?.active) {
        employee = device.employee;
      }
    }

    if (!employee && pairCode) {
      employee = await prisma.employee.findFirst({
        where: {
          companyId,
          pairCode,
          active: true,
        },
      });
    }

    if (!employee) {
      return jsonError(
        "Werknemer niet gevonden of toestel niet gekoppeld",
        404
      );
    }

    const scanEvent = await prisma.scanEvent.create({
      data: {
        companyId: employee.companyId,
        employeeId: employee.id,
        scanTagId: tag.id,
        type: tag.direction,
      },
    });

    await upsertAttendanceDay(employee, scanEvent.scannedAt);

    return jsonOk({
      message: "Scan geregistreerd",
      type: tag.direction,
      scannedAt: scanEvent.scannedAt,
      employee: {
        id: employee.id,
        name: employee.name,
        pairCode: employee.pairCode,
      },
    });
  } catch (error) {
    console.error("POST /api/scan/[secret] error:", error);
    return jsonError("Scan mislukt", 500);
  }
}