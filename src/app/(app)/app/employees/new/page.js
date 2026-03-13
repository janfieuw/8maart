"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
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
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

function generatePairCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

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

export default function NewEmployeePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [pairCode, setPairCode] = useState(generatePairCode());
  const [expectedMode, setExpectedMode] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function createEmployee(e) {
    e.preventDefault();
    setSaving(true);
    setErr("");

    try {
      const payload = {
        name: String(name || "").trim(),
        pairCode: String(pairCode || "").trim(),
      };

      if (expectedMode) {
        payload.expectedMode = expectedMode;
      }

      const res = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await readJson(res);
      router.push(`/app/employees/${data.employee.id}`);
    } catch (e2) {
      setErr(e2?.message || "Fout bij aanmaken werknemer");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                component={Link}
                href="/app/employees"
                variant="text"
                startIcon={<ArrowBackIcon />}
              >
                Terug
              </Button>

              <Box>
                <Typography variant="h4" fontWeight={800}>
                  Nieuwe werknemer
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Maak een nieuwe werknemer aan
                </Typography>
              </Box>
            </Stack>

            {err ? <Alert severity="error">{err}</Alert> : null}

            <Box component="form" onSubmit={createEmployee}>
              <Stack spacing={3}>
                <TextField
                  label="Naam"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  fullWidth
                />

                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    label="PairCode"
                    value={pairCode}
                    onChange={(e) => setPairCode(e.target.value)}
                    required
                    fullWidth
                  />

                  <Button
                    variant="outlined"
                    onClick={() => setPairCode(generatePairCode())}
                  >
                    Genereer
                  </Button>
                </Stack>

                <FormControl fullWidth>
                  <InputLabel id="expected-mode-label">Expected mode</InputLabel>
                  <Select
                    labelId="expected-mode-label"
                    value={expectedMode}
                    label="Expected mode"
                    onChange={(e) => setExpectedMode(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Geen</em>
                    </MenuItem>
                    <MenuItem value="ROSTER">ROSTER</MenuItem>
                    <MenuItem value="CALENDAR">CALENDAR</MenuItem>
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