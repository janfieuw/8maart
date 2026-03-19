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
      setDeviceJustPaired(false);

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
    if (!secret || !deviceToken || submitting || pairing) {
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess(null);

    try {
      const res = await fetch(`/api/scan/${secret}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceToken }),
      });

      const data = await readJson(res);
      setSuccess(data);
      setDeviceJustPaired(false);
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

    if (!secret || !deviceToken || pairing || submitting) {
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

      await readJson(pairRes);

      setPairCode("");
      setDeviceJustPaired(true);
      setError("");
      setSuccess({
        pairedOnly: true,
      });
    } catch (e) {
      setError(e?.message || "Koppelen mislukt.");
    } finally {
      setPairing(false);
    }
  }

  const needsPairCode =
    !success &&
    !submitting &&
    !pairing &&
    !!error &&
    isPairingRequiredError(error);

  const pairingError =
    error && !isPairingRequiredError(error) ? error : "";

  const canScan =
    !loading &&
    !!scanTag &&
    !!deviceToken &&
    !submitting &&
    !pairing;

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
                    Je toestel is gekoppeld. Druk nu op SCAN NU.
                  </Typography>

                  <Button
                    variant="contained"
                    size="large"
                    onClick={submitScan}
                    disabled={!canScan}
                    sx={{
                      py: 2,
                      px: 4,
                      fontSize: 20,
                      fontWeight: 800,
                      borderRadius: 999,
                    }}
                  >
                    {submitting ? "SCANNEN..." : "SCAN NU"}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ) : null}

          {success && !success?.pairedOnly ? (
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
                    {getSuccessTitle(success?.type)}
                  </Typography>

                  <Typography variant="body1" color="text.secondary">
                    Registratie succesvol verwerkt.
                  </Typography>
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

          {!loading && !success && !needsPairCode && !error ? (
            <Card sx={{ borderRadius: 4 }}>
              <CardContent sx={{ p: 4 }}>
                <Stack spacing={3} alignItems="center">
                  <Typography variant="h4" fontWeight={800} textAlign="center">
                    Klaar om te scannen
                  </Typography>

                  <Typography variant="body1" color="text.secondary" textAlign="center">
                    Druk op de knop hieronder om je scan te registreren.
                  </Typography>

                  <Button
                    variant="contained"
                    size="large"
                    onClick={submitScan}
                    disabled={!canScan}
                    sx={{
                      py: 2,
                      px: 4,
                      fontSize: 20,
                      fontWeight: 800,
                      borderRadius: 999,
                    }}
                  >
                    {submitting ? "SCANNEN..." : "SCAN NU"}
                  </Button>
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
                      Voer je koppelcode één keer in om dit toestel te koppelen.
                    </Typography>

                    <TextField
                      label="Koppelcode"
                      value={pairCode}
                      onChange={(e) =>
                        setPairCode(String(e.target.value || "").toUpperCase())
                      }
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
                <Stack spacing={2}>
                  <Alert severity="error">{error}</Alert>

                  {scanTag ? (
                    <Button
                      variant="contained"
                      size="large"
                      onClick={submitScan}
                      disabled={!canScan}
                      sx={{
                        py: 2,
                        fontSize: 18,
                        fontWeight: 800,
                        borderRadius: 999,
                      }}
                    >
                      {submitting ? "OPNIEUW PROBEREN..." : "PROBEER OPNIEUW"}
                    </Button>
                  ) : null}
                </Stack>
              </CardContent>
            </Card>
          ) : null}
        </Stack>
      </Box>
    </Box>
  );
}