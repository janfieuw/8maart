"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

function formatDateTime(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString("nl-BE");
  } catch {
    return "-";
  }
}

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

function TypeChip({ value }) {
  const v = String(value || "").toUpperCase();

  if (v === "IN") {
    return <Chip label="IN" color="success" variant="outlined" size="small" />;
  }

  if (v === "OUT") {
    return <Chip label="OUT" color="warning" variant="outlined" size="small" />;
  }

  return <Chip label={v || "-"} variant="outlined" size="small" />;
}

export default function RegistrationsPage() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/registrations", {
          cache: "no-store",
        });

        const data = await readJson(res);

        if (!active) return;

        setRows(Array.isArray(data.rows) ? data.rows : []);
      } catch (e) {
        if (!active) return;
        setError(e?.message || "Registraties laden mislukt.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const filteredRows = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();

    if (!q) return rows;

    return rows.filter((row) => {
      return (
        String(row.employee?.name || "").toLowerCase().includes(q) ||
        String(row.employee?.pairCode || "").toLowerCase().includes(q) ||
        String(row.type || "").toLowerCase().includes(q) ||
        String(row.scanTag?.direction || "").toLowerCase().includes(q) ||
        String(row.scanTag?.secret || "").toLowerCase().includes(q)
      );
    });
  }, [rows, query]);

  return (
    <Box>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Registraties
          </Typography>
        </Box>

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Card>
          <CardContent>
            <Stack spacing={3}>
              <TextField
                placeholder="Zoek werknemer, paircode, type of tag..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                fullWidth
                sx={{ maxWidth: 520 }}
              />

              {loading ? (
                <Stack direction="row" spacing={2} alignItems="center">
                  <CircularProgress size={22} />
                  <Typography>Registraties laden...</Typography>
                </Stack>
              ) : (
                <Box sx={{ overflowX: "auto" }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>Datum</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Werknemer</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>PairCode</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>QR richting</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Tag secret</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {filteredRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6}>
                            Geen registraties gevonden.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRows.map((row) => (
                          <TableRow key={row.id} hover>
                            <TableCell>{formatDateTime(row.scannedAt)}</TableCell>
                            <TableCell>{row.employee?.name || "-"}</TableCell>
                            <TableCell>{row.employee?.pairCode || "-"}</TableCell>
                            <TableCell>
                              <TypeChip value={row.type} />
                            </TableCell>
                            <TableCell>
                              <TypeChip value={row.scanTag?.direction} />
                            </TableCell>
                            <TableCell
                              sx={{
                                maxWidth: 360,
                                wordBreak: "break-all",
                                fontFamily: "monospace",
                                fontSize: 13,
                              }}
                            >
                              {row.scanTag?.secret || "-"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}