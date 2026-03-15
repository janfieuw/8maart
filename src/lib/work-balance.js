function toDateKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatBalanceMinutes(minutes) {
  if (minutes > 0) return `+${minutes} minuten`;
  if (minutes < 0) return `${minutes} minuten`;
  return "0 minuten";
}

export function calculateWorkedMinutesFromScans(scans) {
  if (!Array.isArray(scans) || scans.length === 0) {
    return 0;
  }

  const ordered = [...scans].sort(
    (a, b) => new Date(a.scannedAt) - new Date(b.scannedAt)
  );

  let totalMinutes = 0;
  let openIn = null;

  for (const scan of ordered) {
    if (scan.type === "IN") {
      openIn = scan;
      continue;
    }

    if (scan.type === "OUT" && openIn) {
      const diffMinutes = Math.round(
        (new Date(scan.scannedAt) - new Date(openIn.scannedAt)) / 60000
      );

      if (diffMinutes > 0) {
        totalMinutes += diffMinutes;
      }

      openIn = null;
    }
  }

  return totalMinutes;
}

export function getExpectedMinutesForEmployee({
  employee,
  dayKeys,
  defaultDailyMinutes = 8 * 60,
}) {
  if (!employee) return dayKeys.length * defaultDailyMinutes;

  if (typeof employee.dailyMinutes === "number") {
    return dayKeys.length * employee.dailyMinutes;
  }

  return dayKeys.length * defaultDailyMinutes;
}

export function buildEmployeeBalances({
  employees,
  scans,
  defaultDailyMinutes = 8 * 60,
}) {
  const scansByEmployee = new Map();

  for (const employee of employees) {
    scansByEmployee.set(employee.id, []);
  }

  for (const scan of scans) {
    if (!scansByEmployee.has(scan.employeeId)) {
      scansByEmployee.set(scan.employeeId, []);
    }

    scansByEmployee.get(scan.employeeId).push(scan);
  }

  return employees
    .map((employee) => {
      const employeeScans = scansByEmployee.get(employee.id) || [];
      const workedMinutes = calculateWorkedMinutesFromScans(employeeScans);

      const uniqueDays = [
        ...new Set(employeeScans.map((scan) => toDateKey(scan.scannedAt))),
      ];

      const expectedMinutes = getExpectedMinutesForEmployee({
        employee,
        dayKeys: uniqueDays,
        defaultDailyMinutes,
      });

      const balanceMinutes = workedMinutes - expectedMinutes;

      return {
        employeeId: employee.id,
        name: employee.name,
        workedMinutes,
        expectedMinutes,
        balanceMinutes,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "nl-BE"));
}