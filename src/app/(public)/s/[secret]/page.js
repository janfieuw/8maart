"use client";

import { useEffect, useState } from "react";
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

export default function PublicScanPage() {
  const params = useParams();
  const secret = String(params?.secret || "").trim();

  const [loading, setLoading] = useState(true);
  const [pairing, setPairing] = useState(false);

  const [scanTag, setScanTag] = useState(null);
  const [pairCode, setPairCode] = useState("");
  const [deviceToken, setDeviceToken] = useState("");

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Device token ophalen
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

  // Koppelen
  async function pairDevice(e) {
    e.preventDefault();

    if (!pairCode.trim()) {
      setError("Voer je PairCode in.");
      return;
    }

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
          {!success && !loading && scanTag ? (
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
                      disabled={pairing}
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={pairing}
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
        </Stack>
      </Box>
    </Box>
  );
}