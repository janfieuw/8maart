"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

function generatePairCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

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

export default function NewEmployeePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [pairCode, setPairCode] = useState(generatePairCode());
  const [expectedMode, setExpectedMode] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function regeneratePairCode() {
    setPairCode(generatePairCode());
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErr("");

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: String(name || "").trim(),
          pairCode,
          expectedMode,
        }),
      });

      await readJson(res);
      router.push("/app/employees");
    } catch (e) {
      setErr(e?.message || "Werknemer aanmaken mislukt.");
      regeneratePairCode();
    } finally {
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

            {err ? <Alert severity="error">{err}</Alert> : null}

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  label="Naam"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                  label="Koppel Code"
                  value={pairCode}
                  InputProps={{ readOnly: true }}
                  fullWidth
                  helperText="Deze code wordt automatisch gegenereerd."
                />

                <FormControl fullWidth>
                  <InputLabel id="expected-mode-label">
                    Kies tijdensysteem
                  </InputLabel>

                  <Select
                    labelId="expected-mode-label"
                    value={expectedMode}
                    label="Kies tijdensysteem"
                    onChange={(e) => setExpectedMode(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Geen keuze</em>
                    </MenuItem>

                    <MenuItem value="ROSTER">ROOSTER</MenuItem>
                    <MenuItem value="CALENDAR">KALENDER</MenuItem>
                  </Select>
                </FormControl>

                <Stack direction="row" spacing={2}>
                  <Button type="submit" variant="contained" disabled={saving}>
                    {saving ? "Opslaan..." : "Werknemer aanmaken"}
                  </Button>

                  <Button
                    component={Link}
                    href="/app/employees"
                    variant="text"
                    disabled={saving}
                  >
                    Annuleren
                  </Button>
                </Stack>
              </Stack>
            </form>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}