"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import {
  clearDeviceToken,
  getOrCreateDeviceToken,
} from "@/lib/device-token";

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
  return <Chip label={d || "-"} color={color} variant="outlined" />;
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

export default function PublicScanPage({ params }) {
  const secret = params?.secret;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pairing, setPairing] = useState(false);

  const [scanTag, setScanTag] = useState(null);
  const [pairCode, setPairCode] = useState("");
  const [deviceToken, setDeviceToken] = useState("");
  const [pairedEmployee, setPairedEmployee] = useState(null);

  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");

  const autoTriedRef = useRef(false);

  const direction = useMemo(
    () => String(scanTag?.direction || "").toUpperCase(),
    [scanTag]
  );

  useEffect(() => {
    const token = getOrCreateDeviceToken();
    setDeviceToken(token);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadScanTag() {
      setLoading(true);
      setError("");
      setSuccess(null);

      try {
        const res = await fetch(`/api/public/tags/${secret}`, {
          cache: "no-store",
        });

        const data = await readJson(res);

        if (!cancelled) {
          setScanTag(data.scanTag || null);
        }
      } catch (e) {
        if (!cancelled) {
          setScanTag(null);
          setError(e?.message || "QR-code kon niet geladen worden.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (secret) {
      loadScanTag();
    }

    return () => {
      cancelled = true;
    };
  }, [secret]);

  async function submitScan({ usePairCode = false } = {}) {
    if (!secret || !deviceToken) return;

    setSubmitting(true);
    setError("");
    setSuccess(null);

    try {
      const payload = usePairCode
        ? {
            deviceToken,
            pairCode: String(pairCode || "").trim(),
          }
        : {
            deviceToken,
          };

      const res = await fetch(`/api/scan/${secret}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await readJson(res);
      setSuccess(data);
      setPairedEmployee(data.employee || null);
    } catch (e) {
      setError(e?.message || "Scan registreren mislukt.");
    } finally {
      setSubmitting(false);
    }
  }

  async function pairAndScan(e) {
    e?.preventDefault?.();

    setPairing(true);
    setError("");
    setSuccess(null);

    try {
      const cleanPairCode = String(pairCode || "").trim().toUpperCase();

      if (!cleanPairCode) {
        throw new Error("Voer je PairCode in.");
      }

      const pairRes = await fetch("/api/device/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pairCode: cleanPairCode,
          deviceToken,
        }),
      });

      const pairData = await readJson(pairRes);
      setPairedEmployee(pairData.employee || null);

      const scanRes = await fetch(`/api/scan/${secret}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceToken,
        }),
      });

      const scanData = await readJson(scanRes);
      setSuccess(scanData);
    } catch (e) {
      setError(e?.message || "Koppelen of scannen mislukt.");
    } finally {
      setPairing(false);
    }
  }

  async function unpairDevice() {
    if (!deviceToken) return;

    try {
      await fetch("/api/device/unpair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceToken }),
      });

      clearDeviceToken();
      const newToken = getOrCreateDeviceToken();

      setDeviceToken(newToken);
      setPairedEmployee(null);
      setPairCode("");
      setSuccess(null);
      setError("");
    } catch {
      setError("Toestel ontkoppelen mislukt.");
    }
  }

  useEffect(() => {
    if (
      !loading &&
      scanTag &&
      deviceToken &&
      !autoTriedRef.current
    ) {
      autoTriedRef.current = true;
      submitScan({ usePairCode: false });
    }
  }, [loading, scanTag, deviceToken]);

  const needsPairCode =
    !success && !submitting && !pairing && !!error;

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        bgcolor: "#f6f6f6",
        py: 6,
        px: 2,
      }}
    >
      <Box sx={{ maxWidth: 720, mx: "auto" }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h2" fontWeight={900}>
              Punctoo
            </Typography>
            <Typography variant="h5" color="text.secondary">
              Scan registreren
            </Typography>
          </Box>

          <Card sx={{ borderRadius: 4 }}>
            <CardContent sx={{ p: 4 }}>
              {loading ? (
                <Stack direction="row" spacing={2} alignItems="center">
                  <CircularProgress size={22} />
                  <Typography>QR laden...</Typography>
                </Stack>
              ) : scanTag ? (
                <Stack spacing={3}>
                  <Typography variant="h3" fontWeight={900}>
                    {scanTag.scanLocation?.name || "Onbekende scanlocatie"}
                  </Typography>

                  <Box>{directionChip(direction)}</Box>

                  <Typography variant="h5" color="text.secondary">
                    Locatie: {scanTag.scanLocation?.location || "-"}
                  </Typography>
                </Stack>
              ) : (
                <Alert severity="error">QR-code niet gevonden.</Alert>
              )}
            </CardContent>
          </Card>

          {success ? (
            <Card
              sx={{
                borderRadius: 4,
                border: "3px solid",
                borderColor: direction === "OUT" ? "warning.main" : "success.main",
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Stack spacing={3}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <CheckCircleOutlineIcon
                      color={direction === "OUT" ? "warning" : "success"}
                      sx={{ fontSize: 40 }}
                    />
                    <Typography variant="h4" fontWeight={900}>
                      SCAN {direction || ""} GESLAAGD
                    </Typography>
                  </Stack>

                  <Typography variant="h5" fontWeight={700}>
                    {success.employee?.name || "-"}
                  </Typography>

                  <Typography variant="h5" color="text.secondary">
                    PairCode: {success.employee?.pairCode || "-"}
                  </Typography>

                  <Typography variant="h5" color="text.secondary">
                    Scanlocatie: {success.scanLocation?.name || "-"}
                  </Typography>

                  <Typography variant="h5" color="text.secondary">
                    Locatie: {success.scanLocation?.location || "-"}
                  </Typography>

                  <Typography variant="h5" color="text.secondary">
                    Tijdstip: {fmtDateTime(success.scannedAt)}
                  </Typography>

                  <Button
                    variant="text"
                    color="warning"
                    startIcon={<LinkOffIcon />}
                    onClick={unpairDevice}
                  >
                    Andere werknemer? Ontkoppel dit toestel
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ) : null}

          {error ? (
            <Alert
              severity="error"
              icon={<ErrorOutlineIcon />}
              sx={{ borderRadius: 3 }}
            >
              {error}
            </Alert>
          ) : null}

          {pairedEmployee && !success ? (
            <Alert severity="info" sx={{ borderRadius: 3 }}>
              Toestel gekoppeld aan {pairedEmployee.name}.
            </Alert>
          ) : null}

          {(needsPairCode || (!success && !submitting && !pairing)) ? (
            <Card sx={{ borderRadius: 4 }}>
              <CardContent sx={{ p: 4 }}>
                <Box component="form" onSubmit={pairAndScan}>
                  <Stack spacing={3}>
                    <Typography variant="h4" fontWeight={800}>
                      Eerste keer op dit toestel?
                    </Typography>

                    <Typography variant="body1" color="text.secondary">
                      Voer je PairCode één keer in om dit toestel te koppelen.
                    </Typography>

                    <TextField
                      label="PairCode"
                      value={pairCode}
                      onChange={(e) => setPairCode(e.target.value)}
                      fullWidth
                      autoComplete="off"
                      disabled={loading || submitting || pairing || !scanTag}
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={loading || submitting || pairing || !scanTag}
                      sx={{
                        py: 2,
                        fontSize: 20,
                        fontWeight: 800,
                        borderRadius: 999,
                      }}
                    >
                      {pairing ? "KOPPELEN..." : "KOPPEL TOESTEL EN SCAN"}
                    </Button>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          ) : null}

          {!success && (submitting || pairing) ? (
            <Card sx={{ borderRadius: 4 }}>
              <CardContent sx={{ p: 4 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <CircularProgress size={24} />
                  <Typography variant="h6">
                    {pairing ? "Toestel koppelen..." : "Scan registreren..."}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          ) : null}

          <Typography variant="h6" color="text.secondary">
            QR-richting: {direction || "-"}.
            {direction ? " Je hoeft geen extra keuze te maken." : ""}
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}