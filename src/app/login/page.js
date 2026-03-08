"use client";

import { useRouter } from "next/navigation";
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
import Link from "next/link";

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

export default function LoginPage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setErr("");

    try {
      await readJson(
        await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })
      );

      router.push("/app/employees");
    } catch (e2) {
      setErr(e2?.message || "Login mislukt.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "#f6f6f6", py: 6, px: 2 }}>
      <Box sx={{ maxWidth: 520, mx: "auto" }}>
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h3" fontWeight={900}>
                  Inloggen
                </Typography>
                <Typography color="text.secondary">
                  Meld je aan bij Punctoo
                </Typography>
              </Box>

              {err ? <Alert severity="error">{err}</Alert> : null}

              <Box component="form" onSubmit={submit}>
                <Stack spacing={3}>
                  <TextField
                    label="E-mailadres"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                  />

                  <TextField
                    label="Wachtwoord"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    fullWidth
                  />

                  <Stack direction="row" spacing={2}>
                    <Button type="submit" variant="contained" disabled={saving}>
                      {saving ? "Bezig..." : "Inloggen"}
                    </Button>

                    <Button component={Link} href="/register" variant="text">
                      Account maken
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}