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

export default function ForgotPasswordPage() {
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setInfo("");
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "").trim();

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Verzenden mislukt.");
      }

      setInfo(
        "Als dit e-mailadres gekend is, ontvang je binnenkort instructies om je wachtwoord opnieuw in te stellen."
      );
      e.currentTarget.reset();
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
          Vul je e-mailadres in en we sturen je instructies om je wachtwoord opnieuw in te stellen.
        </Typography>
      </Box>

      {err ? <Alert severity="error">{err}</Alert> : null}
      {info ? <Alert severity="success">{info}</Alert> : null}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <TextField
            name="email"
            label="E-mailadres"
            type="email"
            required
            fullWidth
            InputLabelProps={{
              sx: {
                "& .MuiFormLabel-asterisk": {
                  display: "none",
                },
              },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={saving}
            sx={{
              minHeight: 56,
              borderRadius: 3,
              fontWeight: 700,
              fontSize: "1rem",
            }}
          >
            {saving ? "Verzenden..." : "Verstuur instructies"}
          </Button>

          <Typography color="text.secondary">
            Terug naar{" "}
            <Button
              component={Link}
              href="/login"
              variant="text"
              sx={{ p: 0, minWidth: 0, verticalAlign: "baseline" }}
            >
              inloggen
            </Button>
          </Typography>
        </Stack>
      </Box>
    </Stack>
  );
}