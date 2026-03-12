"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
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

export default function PublicScanPage() {
  const params = useParams();
  const secret = String(params?.secret || "").trim();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pairing, setPairing] = useState(false);

  const [scanTag, setScanTag] = useState(null);
  const [pairCode, setPairCode] = useState("");
  const [deviceToken, setDeviceToken] = useState("");
  const [pairedEmployee, setPairedEmployee] = useState(null);

  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");
  const [deviceJustPaired, setDeviceJustPaired] = useState(false);

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
      if (!secret) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      setSuccess(null);
      setScanTag(null);

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

    loadScanTag();

    return () => {
      cancelled = true;
    };
  }, [secret]);

  async function submitScan({ pairCodeValue = "" } = {}) {
    if (!secret || !deviceToken) {
      throw new Error("Secret of device token ontbreekt.");
    }

    setSubmitting(true);
    setError("");
    setSuccess(null);
    setDeviceJustPaired(false);

    try {
      const payload = {
        deviceToken,
      };

      if (pairCodeValue) {
        payload.pairCode = String(pairCodeValue).trim().toUpperCase();
      }

      const res = await fetch(`/api/scan/${secret}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await readJson(res);
      setSuccess(data);
      setPairedEmployee(data.employee || null);
      return data;
    } catch (e) {
      setError(e?.message || "Scan registreren mislukt.");
      throw e;
    } finally {
      setSubmitting(false);
    }
  }

  async function pairAndScan(e) {
    e?.preventDefault?.();

    if (!secret || !deviceToken) {
      setError("Secret of device token ontbreekt.");
      return;
    }

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
          secret,
        }),
      });

      const pairData = await readJson(pairRes);

      setPairedEmployee(pairData.employee || null);
      setDeviceJustPaired(true);
      setError("");
      setSuccess({
        pairedOnly: true,
        employee: pairData.employee || null,
        scanLocation: scanTag?.scanLocation || null,
      });
    } catch (e) {
      setError(e?.message || "Koppelen mislukt.");
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
      setDeviceJustPaired(false);
      autoTriedRef.current = false;
    } catch {
      setError("Toestel ontkoppelen mislukt.");
    }
  }

  useEffect(() => {
    async function tryAutoScan() {
      if (
        !loading &&
        scanTag &&
        deviceToken &&
        secret &&
        !autoTriedRef.current &&
        !deviceJustPaired
      ) {
        autoTriedRef.current = true;

        try {
          await submitScan();
        } catch {
          // fout wordt al via setError getoond
        }
      }
    }

    tryAutoScan();
  }, [loading, scanTag, deviceToken, secret, deviceJustPaired]);

  const needsPairCode =
    !success && !submitting && !pairing && !!error && !deviceJustPaired;

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
              ) : error ? (
                <Alert severity="error">{error}</Alert>
              ) : (
                <Alert severity="warning">Geen QR-gegevens gevonden.</Alert>
              )}
            </CardContent>
          </Card>

          {success ? (
            <Card
              sx={{
                borderRadius: 4,
                border: "3px solid",
                borderColor:
                  success?.pairedOnly || direction !== "OUT"
                    ? "success.main"
                    : "warning.main",
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Stack spacing={3}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <CheckCircleOutlineIcon
                      color={
                        success?.pairedOnly || direction !== "OUT"
                          ? "success"
                          : "warning"
                      }
                      sx={{ fontSize: 40 }}
                    />
                    <Typography variant="h4" fontWeight={900}>
                      {success?.pairedOnly
                        ? "SMARTPHONE SUCCESVOL GEKOPPELD"
                        : `SCAN ${direction || ""} GESLAAGD`}
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

                  {!success?.pairedOnly ? (
                    <Typography variant="h5" color="text.secondary">
                      Tijdstip: {fmtDateTime(success.scannedAt)}
                    </Typography>
                  ) : null}

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

          {needsPairCode ? (
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
                      {pairing ? "KOPPELEN..." : "KOPPEL TOESTEL"}
                    </Button>

                    {error ? (
                      <Alert severity="error" sx={{ borderRadius: 3 }}>
                        {error}
                      </Alert>
                    ) : null}
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
                    {pairing ? "Smartphone koppelen..." : "Scan registreren..."}
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