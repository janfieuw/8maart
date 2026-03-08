"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Button,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

function typeChip(type) {
  const color = type === "IN" ? "success" : type === "OUT" ? "warning" : "default";
  return <Chip size="small" label={type ?? "-"} color={color} variant="outlined" />;
}

function fmtDateTime(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function fmtTime(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleTimeString();
  } catch {
    return String(value);
  }
}

export default function RegistratiesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

  const [q, setQ] = useState("");
  const [type, setType] = useState("ALL");

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

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/registrations", { cache: "no-store" });
      const data = await readJson(res);
      setRows(data.rows || []);
      setLastRefreshedAt(new Date().toISOString());
    } catch (e) {
      setErr(e?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();

    return rows.filter((r) => {
      if (type !== "ALL" && r.type !== type) return false;
      if (!needle) return true;

      const employee = r.employee?.name ?? "";
      const pairCode = r.employee?.pairCode ?? "";
      const tagName = r.scanTag?.scanLocation?.name ?? "";
      const locationName = r.scanTag?.scanLocation?.location ?? "";
      const direction = r.scanTag?.direction ?? "";

      const hay = `${employee} ${pairCode} ${tagName} ${locationName} ${direction} ${r.type}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [rows, q, type]);

  return (
    <Box>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    Registraties
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overzicht van ScanEvents
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
            </Box>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Zoeken"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                fullWidth
              />
              <TextField
                label="Type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                select
                sx={{ width: { xs: "100%", md: 220 } }}
              >
                <MenuItem value="ALL">Alle</MenuItem>
                <MenuItem value="IN">IN</MenuItem>
                <MenuItem value="OUT">OUT</MenuItem>
              </TextField>
            </Stack>

            {err ? <Alert severity="error">{err}</Alert> : null}

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Wanneer</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Werknemer</TableCell>
                    <TableCell>PairCode</TableCell>
                    <TableCell>Scanlocatie</TableCell>
                    <TableCell>Locatie</TableCell>
                    <TableCell>QR-richting</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <CircularProgress size={18} />
                          <Typography variant="body2">Laden…</Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <Typography variant="body2" color="text.secondary">
                          Geen registraties gevonden.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((r) => (
                      <TableRow key={r.id} hover>
                        <TableCell>{fmtDateTime(r.scannedAt)}</TableCell>
                        <TableCell>{typeChip(r.type)}</TableCell>
                        <TableCell>{r.employee?.name ?? "-"}</TableCell>
                        <TableCell>{r.employee?.pairCode ?? "-"}</TableCell>
                        <TableCell>{r.scanTag?.scanLocation?.name ?? "-"}</TableCell>
                        <TableCell>{r.scanTag?.scanLocation?.location ?? "-"}</TableCell>
                        <TableCell>{r.scanTag?.direction ?? "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="caption" color="text.secondary">
              {lastRefreshedAt ? `Laatst ververst om ${fmtTime(lastRefreshedAt)}.` : "Nog niet ververst."}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}