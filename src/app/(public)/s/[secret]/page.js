"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
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
import CheckIcon from "@mui/icons-material/Check";
import { getOrCreateDeviceToken } from "@/lib/device-token";

const SCAN_LOCK_KEY = "punctoo_scan_lock";
const SCAN_COOLDOWN_MS = 5000;
const BLUE = "#0c4e5f";

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

function isPairingRequiredError(message) {
  const msg = String(message || "").toLowerCase();

  return (
    msg.includes("toestel niet gekoppeld") ||
    msg.includes("werknemer niet gevonden")
  );
}

function getSuccessTitle(type) {
  const normalizedType = String(type || "").trim().toLowerCase();

  if (normalizedType === "out") {
    return "SCAN OUT GESLAAGD";
  }

  return "SCAN IN GESLAAGD";
}

function isScanOut(type) {
  return String(type || "").trim().toLowerCase() === "out";
}

function formatBelgianDateTime(timestamp) {
  if (!timestamp) return null;

  const date = new Date(timestamp);

  const formattedDate = date.toLocaleDateString("nl-BE", {
    timeZone: "Europe/Brussels",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const formattedTime = date.toLocaleTimeString("nl-BE", {
    timeZone: "Europe/Brussels",
    hour: "2-digit",
    minute: "2-digit",
  });

  return { formattedDate, formattedTime };
}

function canScanNow() {
  try {
    const last = Number(localStorage.getItem(SCAN_LOCK_KEY) || 0);
    const now = Date.now();
    return now - last > SCAN_COOLDOWN_MS;
  } catch {
    return true;
  }
}

function setScanLock() {
  try {
    localStorage.setItem(SCAN_LOCK_KEY, String(Date.now()));
  } catch {}
}

function SuccessIcon({ color }) {
  return (
    <Box
      sx={{
        width: 64,
        height: 64,
        borderRadius: "50%",
        bgcolor: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CheckIcon sx={{ color: "#fff", fontSize: 36 }} />
    </Box>
  );
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

  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");
  const [deviceJustPaired, setDeviceJustPaired] = useState(false);

  const autoTriedRef = useRef(false);

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

  async function submitScan() {
    if (!secret || !deviceToken) {
      throw new Error("Secret of device token ontbreekt.");
    }

    if (!canScanNow()) {
      return;
    }

    setScanLock();

    setSubmitting(true);
    setError("");
    setSuccess(null);
    setDeviceJustPaired(false);

    try {
      const res = await fetch(`/api/scan/${secret}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceToken }),
      });

      const data = await readJson(res);
      setSuccess(data);
      return data;
    } catch (e) {
      setError(e?.message || "Scan registreren mislukt.");
      throw e;
    } finally {
      setSubmitting(false);
    }
  }

  async function pairDevice(e) {
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

      const data = await readJson(pairRes);

      setDeviceJustPaired(true);
      setError("");

      setSuccess({
        pairedOnly: true,
        employee: data?.employee || null,
      });
    } catch (e) {
      setError(e?.message || "Koppelen mislukt.");
    } finally {
      setPairing(false);
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
        } catch {}
      }
    }

    tryAutoScan();
  }, [loading, scanTag, deviceToken, secret, deviceJustPaired]);

  const needsPairCode =
    !success &&
    !submitting &&
    !pairing &&
    !!error &&
    !deviceJustPaired &&
    isPairingRequiredError(error);

  const pairingError =
    error && !isPairingRequiredError(error) ? error : "";

  const employeeName = success?.employee?.name || null;
  const timestamp = success?.scannedAt || null;
  const formatted = formatBelgianDateTime(timestamp);

  const isOut = isScanOut(success?.type);

  const borderColor = success?.pairedOnly
    ? "success.main"
    : isOut
    ? BLUE
    : "success.main";

  const iconColor = success?.pairedOnly
    ? "#2e7d32"
    : isOut
    ? BLUE
    : "#2e7d32";

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        bgcolor: "#f6f6f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 420 }}>
        <Stack spacing={3}>
          {success?.pairedOnly ? (
            <Card
              sx={{
                borderRadius: 4,
                border: "3px solid",
                borderColor: borderColor,
                textAlign: "center",
              }}
            >
              <CardContent sx={{ p: 5 }}>
                <Stack spacing={3} alignItems="center">
                  <SuccessIcon color={iconColor} />

                  <Typography variant="h4" fontWeight={900}>
                    SMARTPHONE SUCCESVOL GEKOPPELD
                  </Typography>

                  {employeeName && (
                    <Typography variant="h6">
                      {employeeName}
                    </Typography>
                  )}

                  <Typography variant="h6" color="text.secondary">
                    Je kunt nu de QR code IN scannen om jouw eerste IN te registreren.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          ) : null}

          {success && !success?.pairedOnly ? (
            <Card
              sx={{
                borderRadius: 4,
                border: "3px solid",
                borderColor: borderColor,
                textAlign: "center",
              }}
            >
              <CardContent sx={{ p: 5 }}>
                <Stack spacing={3} alignItems="center">
                  <SuccessIcon color={iconColor} />

                  <Typography variant="h4" fontWeight={900}>
                    {getSuccessTitle(success?.type)}
                  </Typography>

                  {employeeName && (
                    <Typography variant="h5">
                      {employeeName}
                    </Typography>
                  )}

                  {formatted && (
                    <Typography variant="body1" color="text.secondary">
                      {formatted.formattedDate} • {formatted.formattedTime}
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          ) : null}

          {loading ? (
            <Card sx={{ borderRadius: 4 }}>
              <CardContent sx={{ p: 4 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <CircularProgress size={24} />
                  <Typography>QR laden...</Typography>
                </Stack>
              </CardContent>
            </Card>
          ) : null}

          {needsPairCode ? (
            <Card sx={{ borderRadius: 4 }}>
              <CardContent sx={{ p: 4 }}>
                <Box component="form" onSubmit={pairDevice}>
                  <Stack spacing={3}>
                    <Typography variant="h4" fontWeight={800}>
                      Toestel koppelen
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

                    {pairingError ? (
                      <Alert severity="error">{pairingError}</Alert>
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

          {!success && !loading && !needsPairCode && error ? (
            <Card sx={{ borderRadius: 4 }}>
              <CardContent sx={{ p: 4 }}>
                <Alert severity="error">{error}</Alert>
              </CardContent>
            </Card>
          ) : null}
        </Stack>
      </Box>
    </Box>
  );
}