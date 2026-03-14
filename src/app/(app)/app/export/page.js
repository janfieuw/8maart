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

export default function ExportPage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleExport() {
    setBusy(true);
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
      setMessage("Export succesvol gedownload.");
    } catch (e) {
      console.error("Export error:", e);
      setError(e?.message || "Export mislukt.");
    } finally {
      setBusy(false);
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
            Exporteer alle registraties naar CSV.
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
                Download een CSV-bestand met datum, werknemer, paircode, type,
                QR-richting en QR-secret.
              </Typography>

              <Box>
                <Button
                  variant="contained"
                  startIcon={
                    busy ? <CircularProgress size={18} color="inherit" /> : <DownloadOutlinedIcon />
                  }
                  onClick={handleExport}
                  disabled={busy}
                  sx={{
                    minWidth: 220,
                    py: 1.4,
                    fontWeight: 700,
                    borderRadius: 2.5,
                  }}
                >
                  {busy ? "Export bezig..." : "Download CSV"}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}