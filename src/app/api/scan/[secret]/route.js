// route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DUPLICATE_SCAN_WINDOW_MS = 5 * 60 * 1000;

function jsonOk(data = {}, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

function jsonError(error, status = 400, extra = {}) {
  return NextResponse.json(
    {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      ...extra,
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

function msBetween(a, b) {
  return Math.max(0, b.getTime() - a.getTime());
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
      // Nieuwe IN na open IN mag na 5 minuten als start van een nieuwe periode.
      openIn = ts;

      // Als er nog geen geldige OUT geweest is, schuift firstIn mee op.
      if (!firstIn || lastOut === null) {
        firstIn = ts;
      }

      continue;
    }

    if (ev.type === "OUT") {
      if (!openIn) {
        // OUT zonder open IN telt niet mee in workedMin.
        continue;
      }

      if (!firstIn) {
        firstIn = openIn;
      }

      workedMin += minutesBetween(openIn, ts);
      lastOut = ts;
      openIn = null;
    }
  }

  if (openIn) {
    // Incomplete dag => attendance kan NO DATA tonen via firstIn + lastOut null.
    lastOut = null;
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

async function getLastScanEvent(employeeId) {
  return prisma.scanEvent.findFirst({
    where: {
      employeeId,
    },
    orderBy: {
      scannedAt: "desc",
    },
    select: {
      id: true,
      type: true,
      scannedAt: true,
    },
  });
}

function buildScanRuleError({ message, errorCode, type, employee }) {
  return jsonError(message, 400, {
    errorCode,
    type,
    employee: employee
      ? {
          id: employee.id,
          name: employee.name,
          pairCode: employee.pairCode,
        }
      : null,
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
      const device = await prisma.device.findFirst({
        where: {
          deviceToken,
          employee: {
            companyId,
          },
        },
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

    const newDirection = String(tag.direction || "").trim().toUpperCase();
    const lastScanEvent = await getLastScanEvent(employee.id);
    const lastDirection = String(lastScanEvent?.type || "").trim().toUpperCase();

    if (!lastScanEvent) {
      if (newDirection === "OUT") {
        return buildScanRuleError({
          message: "SCAN OUT ZONDER VOORGAANDE SCAN IN",
          errorCode: "MISSING_IN",
          type: newDirection,
          employee,
        });
      }
    } else {
      const lastScannedAt = new Date(lastScanEvent.scannedAt);
      const now = new Date();
      const elapsedMs = msBetween(lastScannedAt, now);
      const isSameType = lastDirection === newDirection;
      const isWithinDuplicateWindow = elapsedMs <= DUPLICATE_SCAN_WINDOW_MS;

      if (isSameType && isWithinDuplicateWindow) {
        return buildScanRuleError({
          message: "FOUTIEVE DUBBELE SCAN",
          errorCode: "DUPLICATE_SCAN",
          type: newDirection,
          employee,
        });
      }

      if (newDirection === "OUT" && lastDirection !== "IN") {
        return buildScanRuleError({
          message: "SCAN OUT ZONDER VOORGAANDE SCAN IN",
          errorCode: "MISSING_IN",
          type: newDirection,
          employee,
        });
      }

      // IN na IN na meer dan 5 minuten:
      // toegestaan als nieuwe start van een volgende periode.
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