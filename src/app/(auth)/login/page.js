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

export default function LoginPage() {
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Inloggen mislukt.");
      }

      window.location.href = "/app/dashboard";
    } catch (e) {
      setErr(e?.message || "Inloggen mislukt.");
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

          <TextField
            name="password"
            label="Wachtwoord"
            type="password"
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
            sx={{
              minHeight: 56,
              borderRadius: 3,
              fontWeight: 700,
              fontSize: "1rem",
            }}
          >
            Inloggen
          </Button>

          <Typography color="text.secondary">
            Nog geen account?{" "}
            <Button
              component={Link}
              href="/register"
              variant="text"
              sx={{ p: 0, minWidth: 0, verticalAlign: "baseline" }}
            >
              Account aanmaken
            </Button>
          </Typography>
        </Stack>
      </Box>
    </Stack>
  );
}