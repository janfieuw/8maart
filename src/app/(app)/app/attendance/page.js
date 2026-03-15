import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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

function formatDisplayDate(dayStr) {
  const [year, month, day] = String(dayStr).split("-");
  return `${day}/${month}/${year}`;
}

function formatMinutes(totalMinutes) {
  const rounded = Math.round(totalMinutes || 0);
  const sign = rounded < 0 ? "-" : "";
  const safe = Math.abs(rounded);
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;
  return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

async function getBaseUrlFromHeaders() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";

  if (!host) {
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  }

  return `${proto}://${host}`;
}

async function loadAttendanceRows(from, to) {
  const baseUrl = await getBaseUrlFromHeaders();
  const url = new URL("/api/attendance", baseUrl);

  url.searchParams.set("from", from);
  url.searchParams.set("to", to);

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
    .join("; ");

  const res = await fetch(url.toString(), {
    cache: "no-store",
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });

  const data = await res.json();

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || "Attendance laden mislukt.");
  }

  return Array.isArray(data.rows) ? data.rows : [];
}

export default async function AttendancePage({ searchParams }) {
  const session = await getSession();

  if (!session?.companyId) {
    redirect("/login");
  }

  const params = (await searchParams) || {};
  const today = new Date();

  const fromParam = String(params.from || formatDateInput(today));
  const toParam = String(params.to || formatDateInput(today));
  const nameParam = String(params.name || "").trim();

  let rows = [];
  let loadError = "";

  try {
    const apiRows = await loadAttendanceRows(fromParam, toParam);

    rows = apiRows.filter((row) => {
      if (!nameParam) return true;

      return String(row.employeeName || "")
        .toLowerCase()
        .includes(nameParam.toLowerCase());
    });
  } catch (error) {
    loadError = error?.message || "Attendance laden mislukt.";
  }

  const totalExpectedMinutes = rows.reduce(
    (sum, row) => sum + Number(row.expectedMin || 0),
    0
  );
  const totalAttendanceMinutes = rows.reduce(
    (sum, row) => sum + Number(row.workedMin || 0),
    0
  );
  const totalDifferenceMinutes = rows.reduce(
    (sum, row) => sum + Number(row.deltaMin || 0),
    0
  );

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

              {loadError ? (
                <Typography sx={{ color: "#b42318", fontWeight: 600 }}>
                  {loadError}
                </Typography>
              ) : null}

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
                      <TableRow key={row.id}>
                        <TableCell>{formatDisplayDate(row.day)}</TableCell>
                        <TableCell>{row.employeeName}</TableCell>
                        <TableCell>{row.pairCode}</TableCell>
                        <TableCell>{formatMinutes(row.expectedMin)}</TableCell>
                        <TableCell>{formatMinutes(row.workedMin)}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={formatMinutes(row.deltaMin)}
                            color={row.deltaMin < 0 ? "error" : "success"}
                            variant="outlined"
                          />
                        </TableCell>
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