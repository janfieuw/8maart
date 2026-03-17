"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { getOrCreateDeviceToken } from "@/lib/device-token";

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

function isDeviceNotPairedError(message) {
  const msg = String(message || "").toLowerCase();

  return (
    msg.includes("toestel niet gekoppeld") ||
    msg.includes("werknemer niet gevonden")
  );
}

export default function PublicScanPage() {
  const params = useParams();
  const secret = String(params?.secret || "").trim();

  const [loading, setLoading] = useState(false);
  const [pairing, setPairing] = useState(false);

  const [scanTag, setScanTag] = useState(null);
  const [pairCode, setPairCode] = useState("");
  const [deviceToken, setDeviceToken] = useState("");

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showPairForm, setShowPairForm] = useState(false);

  const autoTriedRef = useRef(false);

  const direction = useMemo(
    () => String(scanTag?.direction || "").toUpperCase(),
    [scanTag]
  );

  // Device token
  useEffect(() => {
    const token = getOrCreateDeviceToken();
    setDeviceToken(token);
  }, []);

  // QR laden
  useEffect(() => {
    let cancelled = false;

    async function loadScanTag() {
      if (!secret) return;

      setLoading(true);
      setError("");

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
          setError(e?.message || "QR-code kon niet geladen worden.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadScanTag();

    return () => {
      cancelled = true;
    };
  }, [secret]);

  // Auto scan poging
  useEffect(() => {
    async function tryAutoScan() {
      if (
        !loading &&
        scanTag &&
        deviceToken &&
        secret &&
        !autoTriedRef.current
      ) {
        autoTriedRef.current = true;

        try {
          await fetch(`/api/scan/${secret}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deviceToken }),
          });
        } catch (e) {
          const message = e?.message || "";

          if (isDeviceNotPairedError(message)) {
            setShowPairForm(true);
          } else {
            setError(message);
          }
        }
      }
    }

    tryAutoScan();
  }, [loading, scanTag, deviceToken, secret]);

  // Koppelen
  async function pairDevice(e) {
    e.preventDefault();

    setPairing(true);
    setError("");

    try {
      const res = await fetch("/api/device/pair", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pairCode: pairCode.trim().toUpperCase(),
          deviceToken,
          secret,
        }),
      });

      await readJson(res);

      setSuccess(true);
    } catch (e) {
      setError(e?.message || "Koppelen mislukt.");
    } finally {
      setPairing(false);
    }
  }

  const needsPairCode = showPairForm && !success;

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
          {/* ✅ SUCCESS */}
          {success ? (
            <Card
              sx={{
                borderRadius: 4,
                border: "3px solid",
                borderColor: "success.main",
                textAlign: "center",
              }}
            >
              <CardContent sx={{ p: 5 }}>
                <Stack spacing={3} alignItems="center">
                  <CheckCircleOutlineIcon
                    color="success"
                    sx={{ fontSize: 50 }}
                  />

                  <Typography variant="h4" fontWeight={900}>
                    SMARTPHONE SUCCESVOL GEKOPPELD
                  </Typography>

                  <Typography variant="h6" color="text.secondary">
                    Start nu met scannen
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          ) : null}

          {/* ✅ PAIR FORM */}
          {needsPairCode ? (
            <Card sx={{ borderRadius: 4 }}>
              <CardContent sx={{ p: 4 }}>
                <Box component="form" onSubmit={pairDevice}>
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
                      disabled={loading || pairing || !scanTag}
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={loading || pairing || !scanTag}
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
                      <Alert severity="error">{error}</Alert>
                    ) : null}
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          ) : null}

          {/* LOADING */}
          {!success && loading ? (
            <Card sx={{ borderRadius: 4 }}>
              <CardContent sx={{ p: 4 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <CircularProgress size={24} />
                  <Typography>QR laden...</Typography>
                </Stack>
              </CardContent>
            </Card>
          ) : null}
        </Stack>
      </Box>
    </Box>
  );
}