"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setSaving(true);

    try {
      const res = await fetch("/api/admin/login", {
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
      window.location.href = "/admin";
    } catch (e) {
      setErr(e?.message || "Inloggen mislukt.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        bgcolor: "#f5f5f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 520,
          borderRadius: "28px",
          border: "1px solid #dde3e8",
          boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={4}>
            <Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  color: "#111827",
                  mb: 1,
                  fontSize: { xs: "2rem", md: "2.4rem" },
                }}
              >
                Admin login
              </Typography>

              <Typography color="text.secondary">
                Meld je aan om het Punctoo admin platform te openen.
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
                    placeholder="admin@punctoo.be"
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
                    bgcolor: "#024659",
                    "&:hover": {
                      bgcolor: "#013646",
                    },
                  }}
                >
                  {saving ? "Bezig..." : "INLOGGEN"}
                </Button>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}