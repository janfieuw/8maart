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

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundedRectPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawCenteredText(ctx, text, x, y, options = {}) {
  const {
    font = "400 32px Arial",
    color = "#000",
    align = "center",
    baseline = "middle",
  } = options;

  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawCircle(ctx, cx, cy, radius, fill) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#f3f3ef";
  ctx.stroke();
  ctx.restore();
}

function drawPillLabel(ctx, text, x, y, width, height) {
  const radius = height / 2;

  ctx.save();
  roundedRectPath(ctx, x, y, width, height, radius);
  ctx.fillStyle = "#c7cabf";
  ctx.fill();

  ctx.font = "500 38px Arial";
  ctx.fillStyle = "#111";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + width / 2, y + height / 2 + 1);
  ctx.restore();
}

function drawQrImageContain(ctx, img, x, y, width, height) {
  const ratio = Math.min(width / img.width, height / img.height);
  const drawWidth = img.width * ratio;
  const drawHeight = img.height * ratio;
  const dx = x + (width - drawWidth) / 2;
  const dy = y + (height - drawHeight) / 2;

  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, width, height);
  ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
  ctx.restore();
}

async function buildScanTagBoardDataUrl({ qrInUrl, qrOutUrl }) {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 1050;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context niet beschikbaar");
  }

  const bgColor = "#bcc0b9";
  const green = "#3aa05e";
  const blue = "#024e63";

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  roundedRectPath(ctx, 8, 8, canvas.width - 16, canvas.height - 16, 48);
  ctx.fillStyle = bgColor;
  ctx.fill();

  const leftCircle = { x: 465, y: 500, r: 420 };
  const rightCircle = { x: 1140, y: 500, r: 420 };

  drawCircle(ctx, leftCircle.x, leftCircle.y, leftCircle.r, green);
  drawCircle(ctx, rightCircle.x, rightCircle.y, rightCircle.r, blue);

  const qrSize = 440;
  const leftQrBox = {
    x: leftCircle.x - qrSize / 2,
    y: leftCircle.y - 210,
    width: qrSize,
    height: qrSize,
  };
  const rightQrBox = {
    x: rightCircle.x - qrSize / 2,
    y: rightCircle.y - 210,
    width: qrSize,
    height: qrSize,
  };

  const [qrInImg, qrOutImg] = await Promise.all([
    loadImage(qrInUrl),
    loadImage(qrOutUrl),
  ]);

  drawQrImageContain(
    ctx,
    qrInImg,
    leftQrBox.x,
    leftQrBox.y,
    leftQrBox.width,
    leftQrBox.height
  );
  drawQrImageContain(
    ctx,
    qrOutImg,
    rightQrBox.x,
    rightQrBox.y,
    rightQrBox.width,
    rightQrBox.height
  );

  drawPillLabel(ctx, "IN", leftCircle.x - 48, 740, 96, 52);
  drawPillLabel(ctx, "OUT", rightCircle.x - 62, 740, 124, 52);

  drawCenteredText(ctx, "Punctoo", 800, 930, {
    font: "400 72px Arial",
    color: "#111",
  });

  return canvas.toDataURL("image/png");
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
                QR {tag.direction}
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
                <Typography variant="body1" sx={{ wordBreak: "break-all" }}>
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
  const [downloadingBoard, setDownloadingBoard] = useState(false);

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

  const tagIn = useMemo(
    () => sortedTags.find((tag) => tag.direction === "IN") || null,
    [sortedTags]
  );

  const tagOut = useMemo(
    () => sortedTags.find((tag) => tag.direction === "OUT") || null,
    [sortedTags]
  );

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

    const filename = `${companySlug || "bedrijf"}-qr-${String(
      tag.direction || ""
    ).toLowerCase()}.png`;

    downloadDataUrl(filename, qrDataUrl);
    setInfo(`QR ${tag.direction} gedownload.`);
    setError("");
  }

  async function handleDownloadBoard() {
    if (!tagIn?.scanUrl || !tagOut?.scanUrl) {
      setError("Voor het Scan Tag bordje zijn zowel QR IN als QR OUT nodig.");
      return;
    }

    try {
      setDownloadingBoard(true);
      setError("");
      setInfo("");

      const [qrInUrl, qrOutUrl] = await Promise.all([
        buildQrDataUrl(tagIn.scanUrl),
        buildQrDataUrl(tagOut.scanUrl),
      ]);

      const boardDataUrl = await buildScanTagBoardDataUrl({
        qrInUrl,
        qrOutUrl,
      });

      const companySlug = String(company?.name || "bedrijf")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      downloadDataUrl(
        `${companySlug || "bedrijf"}-scan-tag.png`,
        boardDataUrl
      );

      setInfo("Scan Tag gedownload.");
    } catch (e) {
      console.error("Download Scan Tag mislukt:", e);
      setError("Download van Scan Tag mislukt.");
    } finally {
      setDownloadingBoard(false);
    }
  }

  function handleOrder(tag) {
    setOrderTag(tag);
  }

  return (
    <Box>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Scan Tag
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Hier kan je de QR-codes van je bedrijf bekijken, kopiëren en downloaden.
          </Typography>
        </Box>

        {error ? <Alert severity="error">{error}</Alert> : null}
        {info ? <Alert severity="success">{info}</Alert> : null}

        <Card>
          <CardContent>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              spacing={2}
            >
              <Stack spacing={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  Bedrijf
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {company?.name || "-"}
                </Typography>
              </Stack>

              <Button
                variant="contained"
                startIcon={<DownloadOutlinedIcon />}
                onClick={handleDownloadBoard}
                disabled={loading || downloadingBoard || !tagIn || !tagOut}
              >
                {downloadingBoard ? "Bezig..." : "Download Scan Tag"}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {loading ? (
          <Card>
            <CardContent>
              <Typography>QR-codes laden...</Typography>
            </CardContent>
          </Card>
        ) : sortedTags.length === 0 ? (
          <Alert severity="warning">
            Er werden geen QR-codes gevonden voor dit bedrijf.
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

      <Dialog
        open={!!orderTag}
        onClose={() => setOrderTag(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Extra tag bestellen</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography>
              Dit is voorlopig een mock van de bestelknop.
            </Typography>
            <Typography>
              Geselecteerde QR: <strong>{orderTag?.direction || "-"}</strong>
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