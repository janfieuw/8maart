import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

function addDaysUTC(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function listDaysInclusive(fromStr, toStr) {
  const out = [];
  let current = startOfDayUTC(fromStr);
  const end = startOfDayUTC(toStr);

  while (current <= end) {
    out.push(formatDateOnlyUTC(current));
    current = addDaysUTC(current, 1);
  }

  return out;
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
    firstIn: firstIn ? firstIn.toISOString() : null,
    lastOut: lastOut ? lastOut.toISOString() : null,
    isOpen: !!openIn,
  };
}

function getRosterWeekdayIndex(dayStr) {
  const jsWeekday = startOfDayUTC(dayStr).getUTCDay(); // zondag=0 ... zaterdag=6
  return jsWeekday === 0 ? 6 : jsWeekday - 1; // maandag=0 ... zondag=6
}

function computeExpectedMinutes(employee, dayStr) {
  if (!employee) return 0;

  if (employee.expectedMode === "ROSTER") {
    const weekday = getRosterWeekdayIndex(dayStr);
    const roster = employee.rosterDays?.find((r) => r.weekday === weekday);
    return roster?.expectedMinutes ?? 0;
  }

  if (employee.expectedMode === "CALENDAR") {
    const calendar = employee.calendarDays?.find((c) => {
      const cDay = formatDateOnlyUTC(new Date(c.date));
      return cDay === dayStr;
    });
    return calendar?.expectedMinutes ?? 0;
  }

  return 0;
}

export async function GET(req) {
  try {
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

    const days = listDaysInclusive(fromDay, toDay);

    if (days.length > 93) {
      return jsonErr("Date range too large. Max 93 days.", { status: 400 });
    }

    const rangeStart = startOfDayUTC(fromDay);
    const rangeEnd = endOfDayUTC(toDay);

    const employees = await prisma.employee.findMany({
      where: {
        active: true,
      },
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        pairCode: true,
        expectedMode: true,
        rosterDays: {
          select: {
            weekday: true,
            expectedMinutes: true,
          },
        },
        calendarDays: {
          where: {
            date: {
              gte: rangeStart,
              lte: rangeEnd,
            },
          },
          select: {
            date: true,
            expectedMinutes: true,
          },
        },
      },
    });

    const scanEvents = await prisma.scanEvent.findMany({
      where: {
        scannedAt: {
          gte: rangeStart,
          lte: rangeEnd,
        },
      },
      orderBy: [{ scannedAt: "asc" }],
      select: {
        id: true,
        employeeId: true,
        type: true,
        scannedAt: true,
      },
    });

    const eventsByEmployeeDay = new Map();

    for (const ev of scanEvents) {
      const dayStr = formatDateOnlyUTC(new Date(ev.scannedAt));
      const key = `${ev.employeeId}__${dayStr}`;
      if (!eventsByEmployeeDay.has(key)) {
        eventsByEmployeeDay.set(key, []);
      }
      eventsByEmployeeDay.get(key).push(ev);
    }

    const rows = [];

    for (const employee of employees) {
      for (const dayStr of days) {
        const key = `${employee.id}__${dayStr}`;
        const dayEvents = eventsByEmployeeDay.get(key) || [];

        const expectedMin = computeExpectedMinutes(employee, dayStr);
        const worked = computeWorkedFromEvents(dayEvents);
        const workedMin = worked.workedMin;
        const deltaMin = workedMin - expectedMin;

        if (worked.firstIn && worked.lastOut) {
          rows.push({
            id: `${employee.id}_${dayStr}`,
            day: dayStr,
            employeeId: employee.id,
            employeeName: employee.name,
            pairCode: employee.pairCode,
            expectedMode: employee.expectedMode,
            expectedMin,
            workedMin,
            deltaMin,
            firstIn: worked.firstIn,
            lastOut: worked.lastOut,
          });
        }
      }
    }

    return jsonOk({ rows });
  } catch (e) {
    return jsonErr(e?.message || "Failed to load attendance", { status: 500 });
  }
}