"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

async function readJson(res) {
  const text = await res.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || text || `HTTP ${res.status}`);
  }

  return data;
}

function todayLocalDateInput() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function fmtDateOnly(value) {
  if (!value) return "-";
  try {
    const d = new Date(`${value}T00:00:00`);
    return d.toLocaleDateString();
  } catch {
    return String(value);
  }
}

function fmtTime(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

function formatMinutesToHHMM(min) {
  if (min == null || Number.isNaN(min)) return "-";

  const sign = min < 0 ? "-" : "";
  const abs = Math.abs(min);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;

  return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
}

function deltaChip(deltaMin) {
  const value = Number(deltaMin || 0);
  const label =
    value > 0
      ? `+${formatMinutesToHHMM(value)}`
      : value < 0
      ? formatMinutesToHHMM(value)
      : "00:00";

  const color = value > 0 ? "success" : value < 0 ? "error" : "default";

  return <Chip size="small" label={label} color={color} variant="outlined" />;
}

export default function AttendancePage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);

  const [from, setFrom] = useState(todayLocalDateInput());
  const [to, setTo] = useState(todayLocalDateInput());

  async function loadData() {
    setLoading(true);
    setErr("");

    try {
      const params = new URLSearchParams({
        from,
        to,
      });

      const res = await fetch(`/api/attendance?${params.toString()}`, {
        cache: "no-store",
      });

      const data = await readJson(res);

      setRows(Array.isArray(data.rows) ? data.rows : []);
      setLastRefresh(new Date());
    } catch (e) {
      setErr(e?.message || "Attendance laden mislukt.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.expectedMin += Number(row.expectedMin || 0);
        acc.workedMin += Number(row.workedMin || 0);
        acc.deltaMin += Number(row.deltaMin || 0);
        return acc;
      },
      { expectedMin: 0, workedMin: 0, deltaMin: 0 }
    );
  }, [rows]);

  return (
    <Box>
      <Card>
        <CardContent>
          <Stack spacing={2.5}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", md: "flex-start" }}
              spacing={2}
            >
              <Box>
                <Typography variant="h4" fontWeight={800}>
                  Attendance
                </Typography>
                <Typography color="text.secondary">
                  Afgewerkte aanwezigheden per werknemer met expected,
                  attendance en verschil
                </Typography>
              </Box>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <TextField
                  label="Van"
                  type="date"
                  size="small"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Tot"
                  type="date"
                  size="small"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={loadData}
                  disabled={loading}
                >
                  Verversen
                </Button>
              </Stack>
            </Stack>

            {err ? <Alert severity="error">{err}</Alert> : null}

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Datum</TableCell>
                    <TableCell>Werknemer</TableCell>
                    <TableCell>PairCode</TableCell>
                    <TableCell>Expected mode</TableCell>
                    <TableCell>Expected</TableCell>
                    <TableCell>Eerste IN</TableCell>
                    <TableCell>Laatste OUT</TableCell>
                    <TableCell>Attendance</TableCell>
                    <TableCell>Verschil</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <CircularProgress size={18} />
                          <Typography variant="body2">Laden…</Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9}>
                        Geen afgewerkte attendances gevonden in deze periode.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>{fmtDateOnly(row.day)}</TableCell>
                        <TableCell>{row.employeeName}</TableCell>
                        <TableCell>{row.pairCode}</TableCell>
                        <TableCell>{row.expectedMode}</TableCell>
                        <TableCell>{formatMinutesToHHMM(row.expectedMin)}</TableCell>
                        <TableCell>{fmtTime(row.firstIn)}</TableCell>
                        <TableCell>{fmtTime(row.lastOut)}</TableCell>
                        <TableCell>{formatMinutesToHHMM(row.workedMin)}</TableCell>
                        <TableCell>{deltaChip(row.deltaMin)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {!loading && rows.length > 0 ? (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  justifyContent="space-between"
                >
                  <Typography variant="body2">
                    <strong>Totaal expected:</strong>{" "}
                    {formatMinutesToHHMM(totals.expectedMin)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Totaal attendance:</strong>{" "}
                    {formatMinutesToHHMM(totals.workedMin)}
                  </Typography>
                  <Box>
                    <Typography variant="body2" component="span" sx={{ mr: 1 }}>
                      <strong>Totaal verschil:</strong>
                    </Typography>
                    {deltaChip(totals.deltaMin)}
                  </Box>
                </Stack>
              </Paper>
            ) : null}

            <Typography variant="caption" color="text.secondary">
              {lastRefresh
                ? `Laatst ververst om ${lastRefresh.toLocaleTimeString()}`
                : "Nog niet ververst."}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}