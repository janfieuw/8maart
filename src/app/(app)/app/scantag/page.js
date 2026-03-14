"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import QrCode2OutlinedIcon from "@mui/icons-material/QrCode2Outlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";

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

async function copyToClipboard(value) {
  await navigator.clipboard.writeText(String(value || ""));
}

function formatDate(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleDateString("nl-BE");
  } catch {
    return "-";
  }
}

async function buildQrDataUrl(text) {
  return QRCode.toDataURL(text, {
    width: 320,
    margin: 2,
  });
}

function downloadDataUrl(filename, dataUrl) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function TagCard({ tag, onCopy, onDownload, onOrder }) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrError, setQrError] = useState("");

  useEffect(() => {
    let active = true;

    async function makeQr() {
      try {
        setQrError("");
        const url = await buildQrDataUrl(tag.scanUrl);
        if (active) {
          setQrDataUrl(url);
        }
      } catch (error) {
        console.error("QR generatie mislukt:", error);
        if (active) {
          setQrError("QR-code genereren mislukt.");
        }
      }
    }

    makeQr();

    return () => {
      active = false;
    };
  }, [tag.scanUrl]);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={1}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <QrCode2OutlinedIcon />
              <Typography variant="h6" fontWeight={800}>
                ScanTag {tag.direction}
              </Typography>
            </Stack>

            <Chip
              label={tag.direction}
              color={tag.direction === "IN" ? "success" : "primary"}
              variant="outlined"
            />
          </Stack>

          <Divider />

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={3}
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <Box
              sx={{
                width: 220,
                minWidth: 220,
                height: 220,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                backgroundColor: "#fff",
                p: 1,
              }}
            >
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR code ${tag.direction}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  QR laden...
                </Typography>
              )}
            </Box>

            <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
              {qrError ? <Alert severity="error">{qrError}</Alert> : null}

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Secret
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={700}
                  sx={{ wordBreak: "break-all" }}
                >
                  {tag.secret}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Scan URL
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ wordBreak: "break-all" }}
                >
                  {tag.scanUrl}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Aangemaakt op
                </Typography>
                <Typography variant="body1">
                  {formatDate(tag.createdAt)}
                </Typography>
              </Box>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.25}
                flexWrap="wrap"
              >
                <Button
                  variant="outlined"
                  startIcon={<ContentCopyOutlinedIcon />}
                  onClick={() => onCopy(tag.secret, "Secret gekopieerd.")}
                >
                  Kopieer secret
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<ContentCopyOutlinedIcon />}
                  onClick={() => onCopy(tag.scanUrl, "Scan URL gekopieerd.")}
                >
                  Kopieer URL
                </Button>

                <Button
                  variant="contained"
                  startIcon={<DownloadOutlinedIcon />}
                  onClick={() => onDownload(tag, qrDataUrl)}
                  disabled={!qrDataUrl}
                >
                  Download QR
                </Button>

                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<ShoppingCartOutlinedIcon />}
                  onClick={() => onOrder(tag)}
                >
                  Extra tag bestellen
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function ScanTagPage() {
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [scanTags, setScanTags] = useState([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [orderTag, setOrderTag] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      setInfo("");

      try {
        const res = await fetch("/api/account", {
          cache: "no-store",
        });

        const data = await readJson(res);

        if (!active) return;

        setCompany(data.company || null);
        setScanTags(Array.isArray(data.scanTags) ? data.scanTags : []);
      } catch (e) {
        if (!active) return;
        setError(e?.message || "Scantags laden mislukt.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const sortedTags = useMemo(() => {
    return [...scanTags].sort((a, b) => {
      const order = { IN: 0, OUT: 1 };
      return (order[a.direction] ?? 99) - (order[b.direction] ?? 99);
    });
  }, [scanTags]);

  async function handleCopy(value, message) {
    try {
      await copyToClipboard(value);
      setInfo(message);
      setError("");
    } catch {
      setError("Kopiëren mislukt.");
    }
  }

  function handleDownload(tag, qrDataUrl) {
    if (!qrDataUrl) return;

    const companySlug = String(company?.name || "bedrijf")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const filename = `${companySlug || "bedrijf"}-scantag-${String(
      tag.direction || ""
    ).toLowerCase()}.png`;

    downloadDataUrl(filename, qrDataUrl);
    setInfo(`QR-code ${tag.direction} gedownload.`);
    setError("");
  }

  function handleOrder(tag) {
    setOrderTag(tag);
  }

  return (
    <Box>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            ScanTag
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Hier kan je de scantags van je bedrijf bekijken, kopiëren en downloaden.
          </Typography>
        </Box>

        {error ? <Alert severity="error">{error}</Alert> : null}
        {info ? <Alert severity="success">{info}</Alert> : null}

        <Card>
          <CardContent>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Bedrijf
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {company?.name || "-"}
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {loading ? (
          <Card>
            <CardContent>
              <Typography>Scantags laden...</Typography>
            </CardContent>
          </Card>
        ) : sortedTags.length === 0 ? (
          <Alert severity="warning">
            Er werden geen scantags gevonden voor dit bedrijf.
          </Alert>
        ) : (
          <Stack spacing={3}>
            {sortedTags.map((tag) => (
              <TagCard
                key={tag.id}
                tag={tag}
                onCopy={handleCopy}
                onDownload={handleDownload}
                onOrder={handleOrder}
              />
            ))}
          </Stack>
        )}
      </Stack>

      <Dialog open={!!orderTag} onClose={() => setOrderTag(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Extra tag bestellen</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography>
              Dit is voorlopig een mock van de bestelknop.
            </Typography>
            <Typography>
              Geselecteerde tag: <strong>{orderTag?.direction || "-"}</strong>
            </Typography>
            <Typography>
              Bedrijf: <strong>{company?.name || "-"}</strong>
            </Typography>
            <Typography color="text.secondary">
              Later koppelen we hier de echte bestelstroom aan.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderTag(null)}>Sluiten</Button>
          <Button
            variant="contained"
            onClick={() => {
              setInfo("Mock bestelling geregistreerd.");
              setOrderTag(null);
            }}
          >
            Bestellen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}