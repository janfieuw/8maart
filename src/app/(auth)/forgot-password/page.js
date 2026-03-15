"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

function readJsonSafe(text) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

async function readJson(res) {
  const text = await res.text();
  const data = readJsonSafe(text);

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || text || `HTTP ${res.status}`);
  }

  return data;
}

const inputSx = {
  backgroundColor: "#ffffff",
  borderRadius: 2,
};

const subtleLabelSx = {
  fontSize: "0.85rem",
  mb: 0.6,
  color: "#374151",
  fontWeight: 500,
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setInfo("");
    setSaving(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: String(email || "").trim(),
        }),
      });

      await readJson(res);

      setInfo(
        "Als dit e-mailadres gekend is, ontvang je binnenkort instructies om je wachtwoord opnieuw in te stellen."
      );
      setEmail("");
    } catch (e) {
      setErr(e?.message || "Verzenden mislukt.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack spacing={4}>
      <Box>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            color: "#111827",
            mb: 1,
            fontSize: { xs: "2rem", md: "2.5rem" },
          }}
        >
          Wachtwoord vergeten
        </Typography>

        <Typography color="text.secondary">
          Vul je e-mailadres in en we sturen je instructies om je wachtwoord
          opnieuw in te stellen.
        </Typography>
      </Box>

      {err ? <Alert severity="error">{err}</Alert> : null}
      {info ? <Alert severity="success">{info}</Alert> : null}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2.5}>
          <Box>
            <Typography sx={subtleLabelSx}>E-mailadres</Typography>
            <TextField
              fullWidth
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
              placeholder="naam@bedrijf.be"
              InputProps={{
                sx: inputSx,
              }}
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={saving}
            sx={{
              minHeight: 52,
              borderRadius: 3,
              fontWeight: 700,
              fontSize: "1rem",
            }}
          >
            {saving ? "Verzenden..." : "VERSTUUR INSTRUCTIES"}
          </Button>

          <Typography
            sx={{
              fontSize: "0.95rem",
              color: "#374151",
            }}
          >
            Terug naar{" "}
            <Link
              href="/login"
              style={{
                color: "#2e8b57",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              INLOGGEN
            </Link>
          </Typography>
        </Stack>
      </Box>
    </Stack>
  );
}