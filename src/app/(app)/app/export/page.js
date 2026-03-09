"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";

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

function escapeCsv(value) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default function ExportPage() {
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  async function exportRegistrationsCsv() {
    setErr("");
    setInfo("");

    try {
      const res = await fetch("/api/registrations", { cache: "no-store" });
      const data = await readJson(res);
      const rows = Array.isArray(data.rows) ? data.rows : [];

      const headers = [
        "Tijdstip",
        "Werknemer",
        "PairCode",
        "Type",
        "Scanlocatie",
        "Locatie",
      ];

      const csvRows = rows.map((row) => [
        row.scannedAt || "",
        row.employee?.name || "",
        row.employee?.pairCode || "",
        row.type || "",
        row.scanTag?.scanLocation?.name || "",
        row.scanTag?.scanLocation?.location || "",
      ]);

      const csv = [headers, ...csvRows]
        .map((line) => line.map(escapeCsv).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "punctoo-registrations.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setInfo("CSV export gedownload.");
    } catch (e) {
      setErr(e?.message || "Export mislukt.");
    }
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h4" fontWeight={800}>
                Export
              </Typography>
              <Typography color="text.secondary">
                Exporteer gegevens uit je Punctoo-omgeving
              </Typography>
            </Box>

            {err ? <Alert severity="error">{err}</Alert> : null}
            {info ? <Alert severity="success">{info}</Alert> : null}

            <Card variant="outlined">
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h6" fontWeight={700}>
                    Registraties exporteren
                  </Typography>
                  <Typography color="text.secondary">
                    Download alle scanregistraties als CSV-bestand.
                  </Typography>
                  <Box>
                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={exportRegistrationsCsv}
                    >
                      Download CSV
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}