import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

function formatDateInput(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfDay(value) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(value) {
  const d = new Date(value);
  d.setHours(23, 59, 59, 999);
  return d;
}

function formatDisplayDate(value) {
  const d = new Date(value);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatMinutes(totalMinutes) {
  const safe = Math.max(0, Math.floor(totalMinutes || 0));
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function buildDayKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calculateAttendanceMinutes(scans) {
  let total = 0;
  let openIn = null;

  for (const scan of scans) {
    if (scan.type === "IN") {
      if (!openIn) {
        openIn = new Date(scan.scannedAt);
      }
      continue;
    }

    if (scan.type === "OUT" && openIn) {
      const out = new Date(scan.scannedAt);
      const diffMs = out.getTime() - openIn.getTime();

      if (diffMs > 0) {
        total += Math.floor(diffMs / 60000);
      }

      openIn = null;
    }
  }

  return total;
}

export default async function AttendancePage({ searchParams }) {
  const session = await getSession();

  if (!session?.companyId) {
    redirect("/login");
  }

  const companyId = session.companyId;

  const today = new Date();

  const fromParam = searchParams?.from || formatDateInput(today);
  const toParam = searchParams?.to || formatDateInput(today);
  const nameParam = (searchParams?.name || "").trim();

  const fromDate = startOfDay(fromParam);
  const toDate = endOfDay(toParam);

  const scans = await prisma.scanEvent.findMany({
    where: {
      companyId,
      scannedAt: {
        gte: fromDate,
        lte: toDate,
      },
      employee: nameParam
        ? {
            name: {
              contains: nameParam,
              mode: "insensitive",
            },
          }
        : undefined,
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
      { scannedAt: "asc" },
      { employeeId: "asc" },
    ],
  });

  const grouped = new Map();

  for (const scan of scans) {
    if (!scan.employee) continue;

    const dayKey = buildDayKey(scan.scannedAt);
    const key = `${scan.employeeId}__${dayKey}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        date: dayKey,
        employeeId: scan.employeeId,
        employeeName: scan.employee.name || "-",
        pairCode: scan.employee.pairCode || "-",
        scans: [],
      });
    }

    grouped.get(key).scans.push(scan);
  }

  const rows = Array.from(grouped.values())
    .map((group) => {
      const attendanceMinutes = calculateAttendanceMinutes(group.scans);
      const expectedMinutes = 0;
      const differenceMinutes = attendanceMinutes - expectedMinutes;

      return {
        key: `${group.employeeId}-${group.date}`,
        date: group.date,
        employeeName: group.employeeName,
        pairCode: group.pairCode,
        expectedMinutes,
        attendanceMinutes,
        differenceMinutes,
      };
    })
    .sort((a, b) => {
      if (a.date < b.date) return 1;
      if (a.date > b.date) return -1;
      return a.employeeName.localeCompare(b.employeeName);
    });

  const totalExpectedMinutes = rows.reduce((sum, row) => sum + row.expectedMinutes, 0);
  const totalAttendanceMinutes = rows.reduce((sum, row) => sum + row.attendanceMinutes, 0);
  const totalDifferenceMinutes = rows.reduce((sum, row) => sum + row.differenceMinutes, 0);

  return (
    <Box sx={{ px: 2, py: 2 }}>
      <Stack spacing={3}>
        <Card
          sx={{
            borderRadius: "16px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
          }}
        >
          <CardContent>
            <Stack spacing={3}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", md: "flex-start" }}
                spacing={2}
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: "2.4rem",
                      fontWeight: 800,
                      color: "#111827",
                      mb: 0.5,
                    }}
                  >
                    Attendance
                  </Typography>

                  <Typography sx={{ color: "#6b7280" }}>
                    Filter op periode en werknemer
                  </Typography>
                </Box>

                <Box component="form" method="GET">
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    alignItems={{ xs: "stretch", md: "flex-end" }}
                  >
                    <TextField
                      label="Van"
                      name="from"
                      type="date"
                      defaultValue={fromParam}
                      InputLabelProps={{ shrink: true }}
                    />

                    <TextField
                      label="Tot"
                      name="to"
                      type="date"
                      defaultValue={toParam}
                      InputLabelProps={{ shrink: true }}
                    />

                    <TextField
                      label="Naam"
                      name="name"
                      placeholder="Zoek werknemer"
                      defaultValue={nameParam}
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      color="success"
                      sx={{ minHeight: 56, px: 3, fontWeight: 700 }}
                    >
                      Filter toepassen
                    </Button>
                  </Stack>
                </Box>
              </Stack>

              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Datum</TableCell>
                    <TableCell>Werknemer</TableCell>
                    <TableCell>PairCode</TableCell>
                    <TableCell>Expected</TableCell>
                    <TableCell>Attendance</TableCell>
                    <TableCell>Verschil</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        Geen attendance gevonden voor deze filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
                      <TableRow key={row.key}>
                        <TableCell>{formatDisplayDate(row.date)}</TableCell>
                        <TableCell>{row.employeeName}</TableCell>
                        <TableCell>{row.pairCode}</TableCell>
                        <TableCell>{formatMinutes(row.expectedMinutes)}</TableCell>
                        <TableCell>{formatMinutes(row.attendanceMinutes)}</TableCell>
                        <TableCell>{formatMinutes(row.differenceMinutes)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <Card
                variant="outlined"
                sx={{
                  borderRadius: "14px",
                  borderColor: "#e5e7eb",
                }}
              >
                <CardContent sx={{ py: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Typography sx={{ fontWeight: 700 }}>
                        Totaal expected: {formatMinutes(totalExpectedMinutes)}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography sx={{ fontWeight: 700 }}>
                        Totaal attendance: {formatMinutes(totalAttendanceMinutes)}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography sx={{ fontWeight: 700 }}>
                        Totaal verschil: {formatMinutes(totalDifferenceMinutes)}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}