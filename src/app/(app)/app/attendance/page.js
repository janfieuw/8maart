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

function fmtDateTime(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function statusChip(status) {
  const value = String(status || "").toUpperCase();
  const color = value === "IN" ? "success" : value === "OUT" ? "warning" : "default";
  return <Chip size="small" label={value || "-"} color={color} variant="outlined" />;
}

export default function AttendancePage() {
  const [employees, setEmployees] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);

  async function loadData() {
    setLoading(true);
    setErr("");

    try {
      const [employeesRes, registrationsRes] = await Promise.all([
        fetch("/api/employees", { cache: "no-store" }),
        fetch("/api/registrations", { cache: "no-store" }),
      ]);

      const [employeesData, registrationsData] = await Promise.all([
        readJson(employeesRes),
        readJson(registrationsRes),
      ]);

      setEmployees(Array.isArray(employeesData.rows) ? employeesData.rows : []);
      setRegistrations(Array.isArray(registrationsData.rows) ? registrationsData.rows : []);
      setLastRefresh(new Date());
    } catch (e) {
      setErr(e?.message || "Attendance laden mislukt.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const todayRows = useMemo(() => {
    const byEmployee = new Map();

    for (const reg of registrations) {
      const employeeId = reg.employee?.id;
      if (!employeeId) continue;

      const list = byEmployee.get(employeeId) || [];
      list.push(reg);
      byEmployee.set(employeeId, list);
    }

    return employees.map((employee) => {
      const employeeRegs = byEmployee.get(employee.id) || [];
      const sorted = [...employeeRegs].sort(
        (a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime()
      );

      const last = sorted[0] || null;

      return {
        employee,
        lastType: last?.type || null,
        lastScannedAt: last?.scannedAt || null,
        lastLocation: last?.scanTag?.scanLocation?.name || null,
      };
    });
  }, [employees, registrations]);

  return (
    <Box>
      <Card>
        <CardContent>
          <Stack spacing={2.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="h4" fontWeight={800}>
                  Attendance
                </Typography>
                <Typography color="text.secondary">
                  Laatste bekende status per werknemer
                </Typography>
              </Box>

              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={loadData}
                disabled={loading}
              >
                Verversen
              </Button>
            </Stack>

            {err ? <Alert severity="error">{err}</Alert> : null}

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Werknemer</TableCell>
                    <TableCell>PairCode</TableCell>
                    <TableCell>Expected mode</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Laatste scan</TableCell>
                    <TableCell>Scanlocatie</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <CircularProgress size={18} />
                          <Typography variant="body2">Laden…</Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ) : todayRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>Geen werknemers gevonden.</TableCell>
                    </TableRow>
                  ) : (
                    todayRows.map((row) => (
                      <TableRow key={row.employee.id} hover>
                        <TableCell>{row.employee.name}</TableCell>
                        <TableCell>{row.employee.pairCode}</TableCell>
                        <TableCell>{row.employee.expectedMode}</TableCell>
                        <TableCell>{statusChip(row.lastType)}</TableCell>
                        <TableCell>{fmtDateTime(row.lastScannedAt)}</TableCell>
                        <TableCell>{row.lastLocation || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

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