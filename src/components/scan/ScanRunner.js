"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

function fmtDateTime(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("nl-BE");
  } catch {
    return String(value);
  }
}

export default function ScanRunner({ secret }) {
  const [pairCode, setPairCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);

  const successColor = useMemo(() => {
    const type = String(result?.type || "").toUpperCase();
    if (type === "IN") return "success.main";
    if (type === "OUT") return "warning.main";
    return "primary.main";
  }, [result]);

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

  async function submitScan(e) {
    e?.preventDefault?.();
    setLoading(true);
    setErr("");
    setResult(null);

    try {
      const cleanPairCode = String(pairCode || "").trim();
      if (!cleanPairCode) {
        throw new Error("PairCode is verplicht.");
      }

      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret,
          pairCode: cleanPairCode,
        }),
      });

      const data = await readJson(res);
      setResult(data);
      setPairCode("");
    } catch (e2) {
      setErr(e2?.message || "Scan mislukt");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack spacing={2}>
      {err ? (
        <Alert severity="error" icon={<ErrorOutlineIcon />}>
          {err}
        </Alert>
      ) : null}

      {result ? (
        <Card
          variant="outlined"
          sx={{
            borderColor: successColor,
            borderWidth: 2,
          }}
        >
          <CardContent>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckCircleOutlineIcon
                  color={String(result.type).toUpperCase() === "IN" ? "success" : "warning"}
                />
                <Typography variant="h6" fontWeight={700}>
                  SCAN {String(result.type || "").toUpperCase()} GESLAAGD
                </Typography>
              </Stack>

              <Typography variant="body1">
                <strong>{result.employeeName || "-"}</strong>
              </Typography>

              <Typography variant="body2" color="text.secondary">
                PairCode: {result.pairCode || "-"}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Scanlocatie: {result.tagName || "-"}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Locatie: {result.location || "-"}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Tijdstip: {fmtDateTime(result.scannedAt)}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      ) : null}

      <Card variant="outlined">
        <CardContent>
          <Box component="form" onSubmit={submitScan}>
            <Stack spacing={2}>
              <Typography variant="body1" fontWeight={600}>
                Voer je PairCode in
              </Typography>

              <TextField
                label="PairCode"
                value={pairCode}
                onChange={(e) => setPairCode(e.target.value)}
                autoFocus
                fullWidth
              />

              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={18} color="inherit" />
                    <span>Registreren...</span>
                  </Stack>
                ) : (
                  "Scan registreren"
                )}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
}