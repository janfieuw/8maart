"use client";

import { useState } from "react";
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

export default function NewEmployeePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [expectedMode, setExpectedMode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
  Maak een nieuwe werknemer aan en kies systeem voor de referentietijden.
</Typography>
<Typography variant="body2" color="text.secondary">
  Kies rooster wanneer er een vast patroon is in de werkdagen.
</Typography>
<Typography variant="body2" color="text.secondary">
  Kies kalender wanneer de werkdagen wisselend zijn.
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

                <TextField
                  select
                  label="Kies tijdensysteem"
                  value={expectedMode}
                  onChange={(e) => setExpectedMode(e.target.value)}
                  fullWidth
                  disabled={saving}
                >
                  <MenuItem value="">
                    <em>Maak je keuze</em>
                  </MenuItem>
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