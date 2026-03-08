"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Divider,
  Chip,
  Grid,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import PrintIcon from "@mui/icons-material/Print";

function fmtDateTime(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function directionChip(direction) {
  const d = String(direction || "").toUpperCase();
  const color = d === "IN" ? "success" : d === "OUT" ? "warning" : "default";
  return <Chip size="small" label={d || "-"} color={color} variant="outlined" />;
}

function getTagByDirection(row, direction) {
  return (row?.scanTags || []).find((t) => t.direction === direction) || null;
}

function getAppBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    return window.location.origin.replace(/\/$/, "");
  }

  return "";
}

function buildPublicScanUrl(secret) {
  if (!secret) return "";
  const baseUrl = getAppBaseUrl();
  return `${baseUrl}/s/${secret}`;
}

export default function TagsPage() {
  const [rows, setRows] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const [openQr, setOpenQr] = useState(false);
  const [qrRow, setQrRow] = useState(null);
  const [qrInDataUrl, setQrInDataUrl] = useState("");
  const [qrOutDataUrl, setQrOutDataUrl] = useState("");
  const [qrLoading, setQrLoading] = useState(false);

  const emptyForm = {
    id: "",
    name: "",
    location: "",
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

  async function loadTags() {
    setLoading(true);
    setErr("");
    setInfo("");
    try {
      const res = await fetch("/api/tags", { cache: "no-store" });
      const data = await readJson(res);

      setRows(data.rows || []);
      setLastRefresh(new Date());
    } catch (e) {
      setRows([]);
      setErr(e?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTags();
  }, []);

  function openCreateDialog() {
    setErr("");
    setInfo("");
    setForm({ ...emptyForm });
    setOpenCreate(true);
  }

  function openEditDialog(row) {
    setErr("");
    setInfo("");
    setForm({
      id: row.id,
      name: row.name || "",
      location: row.location || "",
    });
    setOpenEdit(true);
  }

  async function openQrDialog(row) {
    setErr("");
    setInfo("");
    setQrRow(row);
    setQrInDataUrl("");
    setQrOutDataUrl("");
    setOpenQr(true);
    setQrLoading(true);

    try {
      const inTag = getTagByDirection(row, "IN");
      const outTag = getTagByDirection(row, "OUT");

      const [inData, outData] = await Promise.all([
        inTag
          ? QRCode.toDataURL(buildPublicScanUrl(inTag.secret), { width: 900, margin: 2 })
          : Promise.resolve(""),
        outTag
          ? QRCode.toDataURL(buildPublicScanUrl(outTag.secret), { width: 900, margin: 2 })
          : Promise.resolve(""),
      ]);

      setQrInDataUrl(inData);
      setQrOutDataUrl(outData);
    } catch (e) {
      setErr(e?.message || "QR genereren mislukt.");
    } finally {
      setQrLoading(false);
    }
  }

  async function createTag() {
    setSaving(true);
    setErr("");
    setInfo("");
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          location: form.location,
        }),
      });

      await readJson(res);

      setOpenCreate(false);
      setForm({ ...emptyForm });
      await loadTags();
      setInfo("Scanlocatie aangemaakt met IN en OUT QR.");
    } catch (e) {
      setErr(e?.message || "Create failed");
    } finally {
      setSaving(false);
    }
  }

  async function updateTag() {
    setSaving(true);
    setErr("");
    setInfo("");
    try {
      if (!form.id) throw new Error("Missing id");

      const res = await fetch(`/api/tags/${form.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          location: form.location,
        }),
      });

      await readJson(res);

      setOpenEdit(false);
      await loadTags();
      setInfo("Scanlocatie bijgewerkt.");
    } catch (e) {
      setErr(e?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTag(id) {
    setErr("");
    setInfo("");
    try {
      const res = await fetch(`/api/tags/${id}`, {
        method: "DELETE",
      });
      await readJson(res);
      await loadTags();
      setInfo("Scanlocatie verwijderd.");
    } catch (e) {
      setErr(e?.message || "Delete failed");
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

  function printQrLabel() {
    if (!qrRow) return;

    const inTag = getTagByDirection(qrRow, "IN");
    const outTag = getTagByDirection(qrRow, "OUT");

    const inUrl = buildPublicScanUrl(inTag?.secret || "");
    const outUrl = buildPublicScanUrl(outTag?.secret || "");

    const name = qrRow.name || "Scanlocatie";
    const location = qrRow.location || "-";

    const win = window.open("", "_blank", "width=1100,height=1200");
    if (!win) {
      setErr("Printvenster kon niet geopend worden.");
      return;
    }

    win.document.write(`
      <html>
        <head>
          <title>ScanTag QR - ${name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 24px;
              color: #111;
            }
            .sheet {
              max-width: 1000px;
              margin: 0 auto;
              border: 2px solid #111;
              padding: 24px;
            }
            .title {
              font-size: 30px;
              font-weight: 700;
              margin-bottom: 8px;
            }
            .meta {
              font-size: 16px;
              margin: 6px 0;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 24px;
              margin-top: 24px;
            }
            .box {
              border: 2px solid #111;
              padding: 16px;
              text-align: center;
            }
            .dir {
              font-size: 26px;
              font-weight: 700;
              margin-bottom: 12px;
            }
            .box img {
              width: 280px;
              height: 280px;
            }
            .secret {
              margin-top: 12px;
              font-family: monospace;
              font-size: 14px;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="sheet">
            <div class="title">${name}</div>
            <div class="meta"><strong>Locatie:</strong> ${location}</div>

            <div class="grid">
              <div class="box">
                <div class="dir">IN</div>
                ${
                  qrInDataUrl
                    ? `<img src="${qrInDataUrl}" alt="QR IN" />`
                    : `<div>Geen QR</div>`
                }
                <div class="secret">${inUrl || "-"}</div>
              </div>

              <div class="box">
                <div class="dir">OUT</div>
                ${
                  qrOutDataUrl
                    ? `<img src="${qrOutDataUrl}" alt="QR OUT" />`
                    : `<div>Geen QR</div>`
                }
                <div class="secret">${outUrl || "-"}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);

    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
              <Box>
                <Typography variant="h5" fontWeight={800}>
                  ScanTags
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Beheer scanlocaties met IN en OUT QR
                </Typography>
              </Box>

              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={loadTags}
                  disabled={loading}
                >
                  Verversen
                </Button>

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={openCreateDialog}
                >
                  Nieuwe ScanTag
                </Button>
              </Stack>
            </Stack>

            {err ? <Alert severity="error">{err}</Alert> : null}
            {info ? <Alert severity="success">{info}</Alert> : null}

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Naam</TableCell>
                    <TableCell>Locatie</TableCell>
                    <TableCell>QR's</TableCell>
                    <TableCell>Aangemaakt</TableCell>
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
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography variant="body2" color="text.secondary">
                          Geen scanlocaties gevonden.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r) => (
                      <TableRow key={r.id} hover>
                        <TableCell>{r.name || "-"}</TableCell>
                        <TableCell>{r.location || "-"}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            {directionChip("IN")}
                            {directionChip("OUT")}
                          </Stack>
                        </TableCell>
                        <TableCell>{fmtDateTime(r.createdAt)}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="QR tonen">
                              <IconButton onClick={() => openQrDialog(r)}>
                                <QrCode2Icon />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Bewerken">
                              <IconButton onClick={() => openEditDialog(r)}>
                                <EditOutlinedIcon />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Verwijderen">
                              <IconButton onClick={() => deleteTag(r.id)}>
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

            <Typography variant="caption" color="text.secondary">
              {lastRefresh
                ? `Laatst ververst om ${lastRefresh.toLocaleTimeString()}`
                : "Nog niet ververst."}
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
        <DialogTitle>Nieuwe Scanlocatie</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Naam"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              fullWidth
              placeholder="Bijv. Ingang magazijn"
            />

            <TextField
              label="Locatie"
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
              fullWidth
              placeholder="Bijv. Poort 3"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)} disabled={saving}>
            Annuleren
          </Button>
          <Button variant="contained" onClick={createTag} disabled={saving}>
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
        <DialogTitle>Scanlocatie bewerken</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Naam"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              fullWidth
            />

            <TextField
              label="Locatie"
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)} disabled={saving}>
            Annuleren
          </Button>
          <Button variant="contained" onClick={updateTag} disabled={saving}>
            {saving ? "Opslaan..." : "Opslaan"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openQr} onClose={() => setOpenQr(false)} fullWidth maxWidth="md">
        <DialogTitle>Scanlocatie QR</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {qrRow?.name || "Scanlocatie"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {qrRow?.location || "-"}
              </Typography>
            </Box>

            <Divider />

            {qrLoading ? (
              <Stack direction="row" spacing={2} alignItems="center">
                <CircularProgress size={18} />
                <Typography variant="body2">QR genereren…</Typography>
              </Stack>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
                    <Stack spacing={2} alignItems="center">
                      {directionChip("IN")}
                      {qrInDataUrl ? (
                        <Box
                          component="img"
                          src={qrInDataUrl}
                          alt="QR IN"
                          sx={{ width: 260, height: 260, bgcolor: "#fff", p: 1, borderRadius: 2 }}
                        />
                      ) : null}
                      <TextField
                        label="QR URL IN"
                        value={buildPublicScanUrl(getTagByDirection(qrRow, "IN")?.secret || "")}
                        fullWidth
                        InputProps={{ readOnly: true }}
                      />
                      <Button
                        startIcon={<ContentCopyIcon />}
                        onClick={() =>
                          copyText(
                            buildPublicScanUrl(getTagByDirection(qrRow, "IN")?.secret || ""),
                            "IN QR-link gekopieerd."
                          )
                        }
                      >
                        Kopieer IN link
                      </Button>
                    </Stack>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
                    <Stack spacing={2} alignItems="center">
                      {directionChip("OUT")}
                      {qrOutDataUrl ? (
                        <Box
                          component="img"
                          src={qrOutDataUrl}
                          alt="QR OUT"
                          sx={{ width: 260, height: 260, bgcolor: "#fff", p: 1, borderRadius: 2 }}
                        />
                      ) : null}
                      <TextField
                        label="QR URL OUT"
                        value={buildPublicScanUrl(getTagByDirection(qrRow, "OUT")?.secret || "")}
                        fullWidth
                        InputProps={{ readOnly: true }}
                      />
                      <Button
                        startIcon={<ContentCopyIcon />}
                        onClick={() =>
                          copyText(
                            buildPublicScanUrl(getTagByDirection(qrRow, "OUT")?.secret || ""),
                            "OUT QR-link gekopieerd."
                          )
                        }
                      >
                        Kopieer OUT link
                      </Button>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button startIcon={<PrintIcon />} onClick={printQrLabel} disabled={qrLoading}>
            Print
          </Button>
          <Button onClick={() => setOpenQr(false)}>Sluiten</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}