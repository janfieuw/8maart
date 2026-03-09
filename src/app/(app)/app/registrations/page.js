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

function fmtDateTime(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function typeChip(type) {
  const value = String(type || "").toUpperCase();
  const color = value === "IN" ? "success" : value === "OUT" ? "warning" : "default";
  return <Chip size="small" label={value || "-"} color={color} variant="outlined" />;
}

export default function RegistrationsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);

  async function loadRows() {
    setLoading(true);
    setErr("");

    try {
      const res = await fetch("/api/registrations", { cache: "no-store" });
      const data = await readJson(res);

      setRows(Array.isArray(data.rows) ? data.rows : []);
      setLastRefresh(new Date());
    } catch (e) {
      setRows([]);
      setErr(e?.message || "Registraties laden mislukt.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRows();
  }, []);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((row) => {
      if (!q) return true;

      return (
        String(row.employee?.name || "").toLowerCase().includes(q) ||
        String(row.employee?.pairCode || "").toLowerCase().includes(q) ||
        String(row.scanTag?.scanLocation?.name || "").toLowerCase().includes(q) ||
        String(row.scanTag?.scanLocation?.location || "").toLowerCase().includes(q) ||
        String(row.type || "").toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  return (
    <Box>
      <Card>
        <CardContent>
          <Stack spacing={2.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="h4" fontWeight={800}>
                  Registraties
                </Typography>
                <Typography color="text.secondary">
                  Overzicht van alle scanregistraties
                </Typography>
              </Box>

              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={loadRows}
                disabled={loading}
              >
                Verversen
              </Button>
            </Stack>

            {err ? <Alert severity="error">{err}</Alert> : null}

            <TextField
              label="Zoeken"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
            />

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tijdstip</TableCell>
                    <TableCell>Werknemer</TableCell>
                    <TableCell>PairCode</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Scanlocatie</TableCell>
                    <TableCell>Locatie</TableCell>
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
                  ) : filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>Geen registraties gevonden.</TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>{fmtDateTime(row.scannedAt)}</TableCell>
                        <TableCell>{row.employee?.name || "-"}</TableCell>
                        <TableCell>{row.employee?.pairCode || "-"}</TableCell>
                        <TableCell>{typeChip(row.type)}</TableCell>
                        <TableCell>{row.scanTag?.scanLocation?.name || "-"}</TableCell>
                        <TableCell>{row.scanTag?.scanLocation?.location || "-"}</TableCell>
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