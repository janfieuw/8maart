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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setSaving(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: String(email || "").trim(),
          password: String(password || ""),
        }),
      });

      await readJson(res);
      window.location.href = "/app";
    } catch (e) {
      setErr(e?.message || "Inloggen mislukt.");
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
          Inloggen
        </Typography>

        <Typography color="text.secondary">
          Meld je aan om verder te gaan.
        </Typography>
      </Box>

      {err ? <Alert severity="error">{err}</Alert> : null}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2.5}>
          <Box>
            <Typography sx={subtleLabelSx}>E-mailadres</Typography>
            <TextField
              fullWidth
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

          <Box>
            <Typography sx={subtleLabelSx}>Wachtwoord</Typography>
            <TextField
              fullWidth
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              InputProps={{
                sx: inputSx,
              }}
            />
          </Box>

          <Box>
            <Link
              href="/forgot-password"
              style={{
                color: "#374151",
                textDecoration: "none",
                fontSize: "0.9rem",
                fontWeight: 500,
              }}
            >
              Wachtwoord vergeten?
            </Link>
          </Box>

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={saving}
            sx={{
              mt: 1,
              borderRadius: 3,
              minHeight: 52,
              fontWeight: 700,
              fontSize: "1rem",
            }}
          >
            {saving ? "Bezig..." : "INLOGGEN"}
          </Button>

          <Typography
            sx={{
              fontSize: "0.95rem",
              color: "#374151",
            }}
          >
            Nog geen account?{" "}
            <Link
              href="/register"
              style={{
                color: "#2e8b57",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              ACCOUNT AANMAKEN
            </Link>
          </Typography>
        </Stack>
      </Box>
    </Stack>
  );
}