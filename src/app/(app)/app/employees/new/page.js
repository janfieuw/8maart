"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

function generatePairCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";

  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

export default function NewEmployeePage() {
  const router = useRouter();

  const initialPairCode = useMemo(() => generatePairCode(6), []);
  const [name, setName] = useState("");
  const [pairCode, setPairCode] = useState(initialPairCode);
  const [expectedMode, setExpectedMode] = useState("ROSTER");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function regeneratePairCode() {
    setPairCode(generatePairCode(6));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          pairCode: String(pairCode || "").trim().toUpperCase(),
          expectedMode,
        }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Werknemer aanmaken mislukt");
      }

      router.push("/app/employees");
      router.refresh();
    } catch (err) {
      setError(err?.message || "Werknemer aanmaken mislukt");
      setSaving(false);
    }
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h4" fontWeight={800}>
                Nieuwe werknemer
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Maak een nieuwe werknemer aan
              </Typography>
            </Box>

            {error ? <Alert severity="error">{error}</Alert> : null}

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  label="Naam"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                  required
                  disabled={saving}
                />

                <Stack spacing={1}>
                  <TextField
                    label="Koppel Code"
                    value={pairCode}
                    onChange={(e) =>
                      setPairCode(
                        String(e.target.value || "")
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, "")
                      )
                    }
                    fullWidth
                    required
                    disabled={saving}
                    inputProps={{ maxLength: 6 }}
                  />

                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Deze code wordt automatisch gegenereerd.
                    </Typography>

                    <Button
                      type="button"
                      variant="text"
                      onClick={regeneratePairCode}
                      disabled={saving}
                      sx={{ textTransform: "none", fontWeight: 700, p: 0, minWidth: 0 }}
                    >
                      Nieuwe code genereren
                    </Button>
                  </Stack>
                </Stack>

                <TextField
                  select
                  label="Kies tijdensysteem"
                  value={expectedMode}
                  onChange={(e) => setExpectedMode(e.target.value)}
                  fullWidth
                  disabled={saving}
                >
                  <MenuItem value="ROSTER">Rooster</MenuItem>
                  <MenuItem value="CALENDAR">Kalender</MenuItem>
                </TextField>

                <Stack direction="row" spacing={2} alignItems="center">
                  <Button type="submit" variant="contained" disabled={saving}>
                    {saving ? "Bezig..." : "Werknemer aanmaken"}
                  </Button>

                  <Button
                    component={Link}
                    href="/app/employees"
                    variant="text"
                    disabled={saving}
                    sx={{ textTransform: "none" }}
                  >
                    Annuleren
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}