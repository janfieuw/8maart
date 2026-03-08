"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  Chip,
  Link,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

function fmtTime(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleTimeString();
  } catch {
    return String(value);
  }
}

function modeChip(mode) {
  const m = (mode || "").toUpperCase();
  const color = m === "ROSTER" ? "info" : m === "CALENDAR" ? "warning" : "default";
  return <Chip size="small" variant="outlined" color={color} label={mode ?? "-"} />;
}

function getRowId(row) {
  return row?.id || "";
}

export default function EmployeesPage() {
  const router = useRouter();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

  const [q, setQ] = useState("");
  const [active, setActive] = useState("ALL");

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    id: "",
    name: "",
    pairCode: "",
    expectedMode: "ROSTER",
    active: true,
  };
  const [form, setForm] = useState(emptyForm);

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

  async function loadEmployees() {
    setLoading(true);
    setErr("");

    try {
      const params = new URLSearchParams();
      const needle = q.trim();
      if (needle) params.set("q", needle);
      if (active !== "ALL") params.set("active", active);

      const res = await fetch(`/api/employees?${params.toString()}`, { cache: "no-store" });
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
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => rows || [], [rows]);

  function goToDetail(row) {
    const id = getRowId(row);
    if (!id) {
      setErr("Row heeft geen id.");
      return;
    }
    router.push(`/app/employees/${id}`);
  }

  function openCreateDialog() {
    setErr("");
    setForm({ ...emptyForm });
    setOpenCreate(true);
  }

  function openEditDialog(row) {
    const id = getRowId(row);
    if (!id) {
      setErr("Row heeft geen id.");
      return;
    }

    setErr("");
    setForm({
      id,
      name: row?.name || "",
      pairCode: row?.pairCode || "",
      expectedMode: row?.expectedMode || "ROSTER",
      active: !!row?.active,
    });
    setOpenEdit(true);
  }

  async function createEmployee() {
    setSaving(true);
    setErr("");
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          pairCode: form.pairCode,
          expectedMode: form.expectedMode,
          active: form.active,
        }),
      });

      await readJson(res);
      setOpenCreate(false);
      await loadEmployees();
    } catch (e) {
      setErr(e?.message || "Create failed");
    } finally {
      setSaving(false);
    }
  }

  async function updateEmployee() {
    if (!form?.id) {
      setErr("Missing id");
      return;
    }

    setSaving(true);
    setErr("");
    try {
      const res = await fetch(`/api/employees/${form.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          pairCode: form.pairCode,
          expectedMode: form.expectedMode,
          active: form.active,
        }),
      });

      await readJson(res);
      setOpenEdit(false);
      await loadEmployees();
    } catch (e) {
      setErr(e?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(row) {
    const id = getRowId(row);
    if (!id) {
      setErr("Row heeft geen id.");
      return;
    }

    setErr("");
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !row.active }),
      });

      await readJson(res);
      await loadEmployees();
    } catch (e) {
      setErr(e?.message || "Update failed");
    }
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ xs: "flex-start", sm: "center" }}
                justifyContent="space-between"
                spacing={1}
              >
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    Werknemers
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Beheer werknemers, PairCodes en expected mode
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={loadEmployees}
                    disabled={loading}
                  >
                    {loading ? "Laden..." : "Verversen"}
                  </Button>

                  <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
                    Nieuwe werknemer
                  </Button>
                </Stack>
              </Stack>
            </Box>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Zoeken"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                fullWidth
                placeholder="Naam, paircode…"
              />
              <TextField
                label="Actief"
                value={active}
                onChange={(e) => setActive(e.target.value)}
                select
                sx={{ width: { xs: "100%", md: 220 } }}
              >
                <MenuItem value="ALL">Alle</MenuItem>
                <MenuItem value="true">Actief</MenuItem>
                <MenuItem value="false">Inactief</MenuItem>
              </TextField>
            </Stack>

            {err ? <Alert severity="error">{err}</Alert> : null}

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Naam</TableCell>
                    <TableCell>PairCode</TableCell>
                    <TableCell>ExpectedMode</TableCell>
                    <TableCell>Actief</TableCell>
                    <TableCell align="right">Acties</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <CircularProgress size={18} />
                          <Typography variant="body2">Laden…</Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography variant="body2" color="text.secondary">
                          Geen werknemers gevonden.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((r) => {
                      const rid = getRowId(r);
                      return (
                        <TableRow key={rid || `${r.pairCode}-${r.name}`} hover>
                          <TableCell>
                            <Link
                              component="button"
                              type="button"
                              underline="hover"
                              onClick={() => goToDetail(r)}
                              sx={{ fontWeight: 600 }}
                            >
                              {r.name ?? "-"}
                            </Link>
                          </TableCell>
                          <TableCell>{r.pairCode ?? "-"}</TableCell>
                          <TableCell>{modeChip(r.expectedMode)}</TableCell>
                          <TableCell>
                            <Switch checked={!!r.active} onChange={() => toggleActive(r)} />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<OpenInNewIcon />}
                                onClick={() => goToDetail(r)}
                              >
                                Detail
                              </Button>

                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<EditIcon />}
                                onClick={() => openEditDialog(r)}
                              >
                                Bewerken
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
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

      <Dialog
        open={openCreate}
        onClose={() => (!saving ? setOpenCreate(false) : null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Nieuwe werknemer</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Naam"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              fullWidth
            />
            <TextField
              label="PairCode"
              value={form.pairCode}
              onChange={(e) => setForm((p) => ({ ...p, pairCode: e.target.value }))}
              fullWidth
              helperText="Moet uniek zijn"
            />
            <TextField
              label="Expected mode"
              value={form.expectedMode}
              onChange={(e) => setForm((p) => ({ ...p, expectedMode: e.target.value }))}
              select
              fullWidth
            >
              <MenuItem value="ROSTER">ROSTER</MenuItem>
              <MenuItem value="CALENDAR">CALENDAR</MenuItem>
            </TextField>

            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Actief
              </Typography>
              <Switch
                checked={!!form.active}
                onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)} disabled={saving}>
            Annuleren
          </Button>
          <Button variant="contained" onClick={createEmployee} disabled={saving}>
            {saving ? "Opslaan..." : "Aanmaken"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openEdit}
        onClose={() => (!saving ? setOpenEdit(false) : null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Werknemer bewerken</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Naam"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              fullWidth
            />
            <TextField
              label="PairCode"
              value={form.pairCode}
              onChange={(e) => setForm((p) => ({ ...p, pairCode: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Expected mode"
              value={form.expectedMode}
              onChange={(e) => setForm((p) => ({ ...p, expectedMode: e.target.value }))}
              select
              fullWidth
            >
              <MenuItem value="ROSTER">ROSTER</MenuItem>
              <MenuItem value="CALENDAR">CALENDAR</MenuItem>
            </TextField>

            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Actief
              </Typography>
              <Switch
                checked={!!form.active}
                onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)} disabled={saving}>
            Annuleren
          </Button>
          <Button variant="contained" onClick={updateEmployee} disabled={saving}>
            {saving ? "Opslaan..." : "Opslaan"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}