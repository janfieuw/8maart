"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
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

export default function NewEmployeePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [pairCode, setPairCode] = useState("");
  const [expectedMode, setExpectedMode] = useState("ROSTER");
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
          name,
          pairCode,
          expectedMode,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Opslaan mislukt.");
      }

      router.push("/app/employees");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Stack spacing={0.5}>
              <Typography variant="h4" fontWeight={800}>
                Nieuwe werknemer
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Maak een nieuwe werknemer aan
              </Typography>
            </Stack>

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  label="Naam *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  fullWidth
                />

                <TextField
                  label="Koppel Code *"
                  value={pairCode}
                  onChange={(e) => setPairCode(e.target.value)}
                  required
                  fullWidth
                />

                <FormControl fullWidth>
                  <InputLabel>Kies tijdensysteem</InputLabel>

                  <Select
                    value={expectedMode}
                    label="Kies tijdensysteem"
                    onChange={(e) => setExpectedMode(e.target.value)}
                  >
                    <MenuItem value="ROSTER">ROOSTER</MenuItem>
                    <MenuItem value="CALENDAR">KALENDER</MenuItem>
                  </Select>
                </FormControl>

                <Stack direction="row" spacing={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={saving}
                  >
                    Werknemer aanmaken
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
            </form>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}