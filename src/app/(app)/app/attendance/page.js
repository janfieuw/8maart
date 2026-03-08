"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toDateOnlyLocal(date) {
  // Local date -> YYYY-MM-DD (local)
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}-${m}-${d}`;
}

function fmtMinutes(min) {
  if (min == null || Number.isNaN(Number(min))) return "-";
  const m = Math.round(Number(min));
  const sign = m < 0 ? "-" : "";
  const abs = Math.abs(m);
  const h = Math.floor(abs / 60);
  const mm = abs % 60;
  return `${sign}${h}:${pad2(mm)}`;
}

function fmtDateTime(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function statusChip(status) {
  const s = String(status || "").toUpperCase();

  let color = "default";
  let label = s || "-";

  // MVP status set uit attendance route:
  // OPEN, PRESENT, ABSENT, OFF
  if (s === "OPEN") color = "warning";
  if (s === "PRESENT") color = "success";
  if (s === "ABSENT") color = "error";
  if (s === "OFF") color = "default";

  return <Chip size="small" label={label} color={color} variant="outlined" />;
}

function modeChip(mode) {
  const m = String(mode || "").toUpperCase();
  const color = m === "CALENDAR" ? "info" : m === "ROSTER" ? "primary" : "default";
  return <Chip size="small" label={m || "-"} color={color} variant="outlined" />;
}

export default function AttendancePage() {
  const today = useMemo(() => new Date(), []);
  const [from, setFrom] = useState(() => toDateOnlyLocal(today));
  const [to, setTo] = useState(() => toDateOnlyLocal(today));

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const qs = new URLSearchParams({ from, to }).toString();
      const res = await fetch(`/api/attendance?${qs}`, { cache: "no-store" });

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

      setRows(Array.isArray(data.rows) ? data.rows : []);
      setLastRefresh(new Date());
    } catch (e) {
      setRows([]);
      setErr(e?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }

  // Eerste load
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const header = useMemo(() => {
    const fromLabel = from || "-";
    const toLabel = to || "-";
    return `${fromLabel} → ${toLabel}`;
  }, [from, to]);

  return (
    <Box>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  Attendance
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Overzicht expected vs worked ({header})
                </Typography>
              </Box>

              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={load}
                disabled={loading}
              >
                {loading ? "Laden..." : "Verversen"}
              </Button>
            </Stack>

            {/* Filters */}
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
              <TextField
                label="Van"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ width: { xs: "100%", md: 220 } }}
              />

              <TextField
                label="Tot"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ width: { xs: "100%", md: 220 } }}
              />

              <Button variant="outlined" onClick={load} disabled={loading}>
                Toepassen
              </Button>

              <Box sx={{ flex: 1 }} />

              <Typography variant="caption" color="text.secondary">
                {lastRefresh ? `Laatst ververst om ${lastRefresh.toLocaleTimeString()}` : "Nog niet ververst."}
              </Typography>
            </Stack>

            {err ? <Alert severity="error">{err}</Alert> : null}

            {/* Table */}
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Dag</TableCell>
                    <TableCell>Werknemer</TableCell>
                    <TableCell>PairCode</TableCell>
                    <TableCell>ExpectedMode</TableCell>
                    <TableCell align="right">Expected</TableCell>
                    <TableCell align="right">Worked</TableCell>
                    <TableCell align="right">Delta</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>IN</TableCell>
                    <TableCell>OUT</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <CircularProgress size={18} />
                          <Typography variant="body2">Laden…</Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10}>
                        <Typography variant="body2" color="text.secondary">
                          Geen attendance records gevonden.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r) => (
                      <TableRow key={r.id} hover>
                        <TableCell>{r.day || "-"}</TableCell>
                        <TableCell>{r.employeeName || "-"}</TableCell>
                        <TableCell>{r.pairCode || "-"}</TableCell>
                        <TableCell>{modeChip(r.expectedMode)}</TableCell>

                        <TableCell align="right">{fmtMinutes(r.expectedMin)}</TableCell>
                        <TableCell align="right">{fmtMinutes(r.workedMin)}</TableCell>
                        <TableCell align="right">{fmtMinutes(r.deltaMin)}</TableCell>

                        <TableCell>{statusChip(r.status)}</TableCell>
                        <TableCell>{fmtDateTime(r.firstIn)}</TableCell>
                        <TableCell>{fmtDateTime(r.lastOut)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="caption" color="text.secondary">
              Tip: je kan ook rechtstreeks testen via /api/attendance?from=YYYY-MM-DD&amp;to=YYYY-MM-DD.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}