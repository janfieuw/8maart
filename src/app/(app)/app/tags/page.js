"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PrintIcon from "@mui/icons-material/Print";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import RefreshIcon from "@mui/icons-material/Refresh";

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
  return `${getAppBaseUrl()}/s/${secret}`;
}

export default function TagsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);

  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [formName, setFormName] = useState("");
  const [formLocation, setFormLocation] = useState("");

  const [openQr, setOpenQr] = useState(false);
  const [qrRow, setQrRow] = useState(null);
  const [qrInDataUrl, setQrInDataUrl] = useState("");
  const [qrOutDataUrl, setQrOutDataUrl] = useState("");

  async function loadLocations() {
    setLoading(true);
    setErr("");
    setInfo("");

    try {
      const res = await fetch("/api/scan-locations", { cache: "no-store" });
      const data = await readJson(res);

      setRows(Array.isArray(data.rows) ? data.rows : []);
      setLastRefresh(new Date());
    } catch (e) {
      setRows([]);
      setErr(e?.message || "Scanlocaties laden mislukt.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLocations();
  }, []);

  function resetCreateForm() {
    setFormName("");
    setFormLocation("");
  }

  function openCreateDialog() {
    setErr("");
    setInfo("");
    resetCreateForm();
    setOpenCreate(true);
  }

  async function createLocation() {
    setSaving(true);
    setErr("");
    setInfo("");

    try {
      const name = String(formName || "").trim();
      const location = String(formLocation || "").trim();

      if (!name) {
        throw new Error("Naam is verplicht.");
      }

      const res = await fetch("/api/scan-locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          location,
        }),
      });

      const createData = await readJson(res);
      const locationRow = createData.scanLocation;

      await Promise.all([
        fetch("/api/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scanLocationId: locationRow.id,
            direction: "IN",
          }),
        }).then(readJson),
        fetch("/api/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scanLocationId: locationRow.id,
            direction: "OUT",
          }),
        }).then(readJson),
      ]);

      setOpenCreate(false);
      resetCreateForm();
      await loadLocations();
      setInfo("Scanlocatie aangemaakt met IN en OUT QR.");
    } catch (e) {
      setErr(e?.message || "Scanlocatie aanmaken mislukt.");
    } finally {
      setSaving(false);
    }
  }

  async function copyText(text, successMessage = "Gekopieerd.") {
    try {
      await navigator.clipboard.writeText(text || "");
      setErr("");
      setInfo(successMessage);
    } catch {
      setErr("Kopiëren is niet gelukt.");
    }
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
            .url {
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
                ${qrInDataUrl ? `<img src="${qrInDataUrl}" alt="QR IN" />` : `<div>Geen QR</div>`}
                <div class="url">${inUrl || "-"}</div>
              </div>

              <div class="box">
                <div class="dir">OUT</div>
                ${qrOutDataUrl ? `<img src="${qrOutDataUrl}" alt="QR OUT" />` : `<div>Geen QR</div>`}
                <div class="url">${outUrl || "-"}</div>
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
          <Stack spacing={2.5}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", md: "flex-start" }}
              spacing={2}
            >
              <Box>
                <Typography variant="h4" fontWeight={800}>
                  ScanTags
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Beheer scanlocaties met IN en OUT QR
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={loadLocations}
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
                    rows.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>{row.name || "-"}</TableCell>
                        <TableCell>{row.location || "-"}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            {directionChip("IN")}
                            {directionChip("OUT")}
                          </Stack>
                        </TableCell>
                        <TableCell>{fmtDateTime(row.createdAt)}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="QR tonen">
                            <IconButton onClick={() => openQrDialog(row)}>
                              <QrCode2Icon />
                            </IconButton>
                          </Tooltip>
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
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              fullWidth
              placeholder="Bijv. Ingang magazijn"
            />

            <TextField
              label="Locatie"
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              fullWidth
              placeholder="Bijv. Poort 3"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)} disabled={saving}>
            Annuleren
          </Button>
          <Button variant="contained" onClick={createLocation} disabled={saving}>
            {saving ? "Opslaan..." : "Aanmaken"}
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
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: "center", flex: 1 }}>
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

                <Paper variant="outlined" sx={{ p: 2, textAlign: "center", flex: 1 }}>
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
              </Stack>
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