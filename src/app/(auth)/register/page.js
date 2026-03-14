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

export default function RegisterPage() {
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setInfo("");

    const formData = new FormData(e.currentTarget);

    const companyName = String(formData.get("companyName") || "").trim();
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName,
          name,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Account aanmaken mislukt.");
      }

      setInfo("Account aangemaakt. Je kan nu inloggen.");
      e.currentTarget.reset();
    } catch (e) {
      setErr(e?.message || "Account aanmaken mislukt.");
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
          Account aanmaken
        </Typography>

        <Typography color="text.secondary">
          Maak een nieuwe omgeving aan voor je bedrijf.
        </Typography>
      </Box>

      {err ? <Alert severity="error">{err}</Alert> : null}
      {info ? <Alert severity="success">{info}</Alert> : null}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <TextField
            name="companyName"
            label="Bedrijfsnaam"
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
            name="name"
            label="Naam"
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
            Account aanmaken
          </Button>

          <Typography color="text.secondary">
            Heb je al een account?{" "}
            <Button
              component={Link}
              href="/login"
              variant="text"
              sx={{ p: 0, minWidth: 0, verticalAlign: "baseline" }}
            >
              Inloggen
            </Button>
          </Typography>
        </Stack>
      </Box>
    </Stack>
  );
}