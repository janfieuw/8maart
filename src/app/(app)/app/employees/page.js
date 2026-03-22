"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SmartphoneIcon from "@mui/icons-material/Smartphone";

function readJsonSafe(text) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

async function readJson(res) {
  const text = await res.text();
  const data = readJsonSafe(text);

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || text || `HTTP ${res.status}`);
  }

  return data;
}

function expectedModeChip(mode) {
  const value = String(mode || "").toUpperCase();

  const label =
    value === "ROSTER"
      ? "ROOSTER"
      : value === "CALENDAR"
      ? "KALENDER"
      : value || "-";

  const color =
    value === "ROSTER"
      ? "info"
      : value === "CALENDAR"
      ? "secondary"
      : "default";

  return <Chip size="small" label={label} color={color} variant="outlined" />;
}

export default function EmployeesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  async function loadEmployees() {
    setLoading(true);
    setErr("");
    setInfo("");

    try {
      const res = await fetch("/api/employees", {
        cache: "no-store",
      });

      const data = await readJson(res);
      setRows(Array.isArray(data.rows) ? data.rows : []);
    } catch (e) {
      setRows([]);
      setErr(e?.message || "Werknemers laden mislukt.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  async function toggleActive(row) {
    setSavingId(row.id);
    setErr("");
    setInfo("");

    try {
      const res = await fetch(`/api/employees/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          active: !row.active,
        }),
      });

      await readJson(res);

      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? {
                ...r,
                active: !r.active,
              }
            : r
        )
      );

      setInfo(`Werknemer ${!row.active ? "geactiveerd" : "gedeactiveerd"}.`);
    } catch (e) {
      setErr(e?.message || "Status wijzigen mislukt.");
    } finally {
      setSavingId("");
    }
  }

  async function deleteEmployee(row) {
    const ok = window.confirm(`Werknemer "${row.name}" verwijderen?`);
    if (!ok) return;

    setSavingId(row.id);
    setErr("");
    setInfo("");

    try {
      const res = await fetch(`/api/employees/${row.id}`, {
        method: "DELETE",
      });

      await readJson(res);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      setInfo("Werknemer verwijderd.");
    } catch (e) {
      setErr(e?.message || "Werknemer verwijderen mislukt.");
    } finally {
      setSavingId("");
    }
  }

  async function copyText(text, message = "Gekopieerd.") {
    try {
      await navigator.clipboard.writeText(text || "");
      setErr("");
      setInfo(message);
    } catch {
      setErr("Kopiëren is niet gelukt.");
    }
  }

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !q ||
        String(row.name || "").toLowerCase().includes(q) ||
        String(row.pairCode || "").toLowerCase().includes(q);

      const matchesActive =
        activeFilter === "all" ||
        (activeFilter === "active" && !!row.active) ||
        (activeFilter === "inactive" && !row.active);

      return matchesSearch && matchesActive;
    });
  }, [rows, search, activeFilter]);

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
                  Werknemers
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Beheer werknemers, Koppel codes en tijdensysteem
                </Typography>

                {/* NIEUW INFO BLOK */}
                <Box
                  sx={{
                    backgroundColor: "#e3f2fd",
                    borderRadius: "12px",
                    px: 2.25,
                    py: 1.75,
                    display: "flex",
                    gap: 1.5,
                    alignItems: "flex-start",
                    mt: 1,
                  }}
                >
                  <SmartphoneIcon
                    sx={{
                      color: "#1e88e5",
                      fontSize: 22,
                      mt: "1px",
                      flexShrink: 0,
                    }}
                  />

                  <Box>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        lineHeight: 1.35,
                        color: "#0b4f71",
                        mb: 0.25,
                      }}
                    >
                      Smartphone koppelen
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: "0.95rem",
                        lineHeight: 1.45,
                        color: "#0b4f71",
                      }}
                    >
                      De koppel code heeft de werknemer straks nodig om zijn smartphone éénmalig te koppelen.
                      Het koppelen kan op de pagina "Scan Tag".
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  component={Link}
                  href="/app/employees/new"
                  variant="contained"
                  startIcon={<AddIcon />}
                >
                  Nieuwe werknemer
                </Button>
              </Stack>
            </Stack>

            {err ? <Alert severity="error">{err}</Alert> : null}
            {info ? <Alert severity="success">{info}</Alert> : null}

            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", md: "center" }}
            >
              <TextField
                label="Zoeken"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                fullWidth
              />

              <FormControl sx={{ minWidth: 160 }}>
                <InputLabel id="active-filter-label">Actief</InputLabel>

                <Select
                  labelId="active-filter-label"
                  value={activeFilter}
                  label="Actief"
                  onChange={(e) => setActiveFilter(e.target.value)}
                >
                  <MenuItem value="all">Alle</MenuItem>
                  <MenuItem value="active">Alleen actief</MenuItem>
                  <MenuItem value="inactive">Alleen inactief</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Naam</TableCell>
                    <TableCell>Koppel Code</TableCell>
                    <TableCell>Tijdensysteem</TableCell>
                    <TableCell>Actief</TableCell>
                    <TableCell align="right">Acties</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5}>Laden...</TableCell>
                    </TableRow>
                  ) : filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        Geen werknemers gevonden.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>
                          <Button
                            component={Link}
                            href={`/app/employees/${row.id}`}
                            variant="text"
                            sx={{
                              p: 0,
                              minWidth: 0,
                              textTransform: "none",
                              fontWeight: 700,
                            }}
                          >
                            {row.name || "-"}
                          </Button>
                        </TableCell>

                        <TableCell>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <span>{row.pairCode || "-"}</span>

                            <Tooltip title="Kopieer Koppel Code">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  copyText(
                                    row.pairCode || "",
                                    "Koppel Code gekopieerd."
                                  )
                                }
                              >
                                <ContentCopyIcon fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>

                        <TableCell>{expectedModeChip(row.expectedMode)}</TableCell>

                        <TableCell>
                          <Switch
                            checked={!!row.active}
                            onChange={() => toggleActive(row)}
                            disabled={savingId === row.id}
                          />
                        </TableCell>

                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                            <Button
                              component={Link}
                              href={`/app/employees/${row.id}`}
                              variant="contained"
                              size="small"
                            >
                              Referentietijden aanpassen
                            </Button>

                            <Tooltip title="Verwijderen">
                              <IconButton
                                onClick={() => deleteEmployee(row)}
                                disabled={savingId === row.id}
                              >
                                <DeleteOutlineIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}