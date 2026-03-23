"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";

function toCsvValue(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function formatDateTime(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("nl-BE");
  } catch {
    return "";
  }
}

function downloadTextFile(filename, content, type = "text/csv;charset=utf-8;") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ExportPage() {
  const [busyCsv, setBusyCsv] = useState(false);
  const [busyPdf, setBusyPdf] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleExportCsv() {
    setBusyCsv(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/registrations", {
        cache: "no-store",
      });

      const data = await readJson(res);
      const rows = Array.isArray(data.rows) ? data.rows : [];

      const csvRows = [
        [
          "Datum",
          "Werknemer",
          "PairCode",
          "Type",
          "QR richting",
          "QR secret",
        ]
          .map(toCsvValue)
          .join(","),
        ...rows.map((row) =>
          [
            formatDateTime(row.scannedAt),
            row.employee?.name || "",
            row.employee?.pairCode || "",
            row.type || "",
            row.scanTag?.direction || "",
            row.scanTag?.secret || "",
          ]
            .map(toCsvValue)
            .join(",")
        ),
      ];

      downloadTextFile("registraties.csv", csvRows.join("\n"));
      setMessage("CSV-export succesvol gedownload.");
    } catch (e) {
      console.error("CSV export error:", e);
      setError(e?.message || "CSV-export mislukt.");
    } finally {
      setBusyCsv(false);
    }
  }

  async function handleExportPdf() {
    setBusyPdf(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/registrations?format=pdf", {
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text();
        let data = null;

        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = null;
        }

        throw new Error(data?.error || text || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      triggerBlobDownload(blob, "registraties.pdf");
      setMessage("PDF-export succesvol gedownload.");
    } catch (e) {
      console.error("PDF export error:", e);
      setError(e?.message || "PDF-export mislukt.");
    } finally {
      setBusyPdf(false);
    }
  }

  return (
    <Box>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Export
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Exporteer alle registraties naar CSV of PDF.
          </Typography>
        </Box>

        {error ? <Alert severity="error">{error}</Alert> : null}
        {message ? <Alert severity="success">{message}</Alert> : null}

        <Card sx={{ borderRadius: 3, maxWidth: 720 }}>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={700}>
                Registraties exporteren
              </Typography>

              <Typography variant="body1" color="text.secondary">
                Download een bestand met datum, werknemer, paircode, type,
                QR-richting en QR-secret.
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  variant="contained"
                  startIcon={
                    busyCsv ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <DownloadOutlinedIcon />
                    )
                  }
                  onClick={handleExportCsv}
                  disabled={busyCsv || busyPdf}
                  sx={{
                    minWidth: 220,
                    py: 1.4,
                    fontWeight: 700,
                    borderRadius: 2.5,
                  }}
                >
                  {busyCsv ? "Export bezig..." : "Download CSV"}
                </Button>

                <Button
                  variant="contained"
                  startIcon={
                    busyPdf ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <PictureAsPdfOutlinedIcon />
                    )
                  }
                  onClick={handleExportPdf}
                  disabled={busyCsv || busyPdf}
                  sx={{
                    minWidth: 220,
                    py: 1.4,
                    fontWeight: 700,
                    borderRadius: 2.5,
                  }}
                >
                  {busyPdf ? "PDF bezig..." : "Download PDF"}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}