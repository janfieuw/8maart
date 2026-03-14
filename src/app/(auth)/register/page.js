"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
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

const hiddenAsteriskSx = {
  "& .MuiFormLabel-asterisk": {
    display: "none",
  },
};

export default function RegisterPage() {
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [vatNumber, setVatNumber] = useState("");
  const [phone, setPhone] = useState("");

  const [billingStreet, setBillingStreet] = useState("");
  const [billingHouseNumber, setBillingHouseNumber] = useState("");
  const [billingPostalCode, setBillingPostalCode] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingCountry, setBillingCountry] = useState("België");

  const [shippingSameAsBilling, setShippingSameAsBilling] = useState(true);
  const [shippingStreet, setShippingStreet] = useState("");
  const [shippingHouseNumber, setShippingHouseNumber] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingCountry, setShippingCountry] = useState("België");

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setSaving(true);

    try {
      const payload = {
        companyName: String(companyName || "").trim(),
        contactName: String(contactName || "").trim(),
        email: String(email || "").trim(),
        password: String(password || ""),
        vatNumber: String(vatNumber || "").trim(),
        phone: String(phone || "").trim(),

        billingStreet: String(billingStreet || "").trim(),
        billingHouseNumber: String(billingHouseNumber || "").trim(),
        billingPostalCode: String(billingPostalCode || "").trim(),
        billingCity: String(billingCity || "").trim(),
        billingCountry: String(billingCountry || "").trim(),

        shippingSameAsBilling,
        shippingStreet: String(shippingStreet || "").trim(),
        shippingHouseNumber: String(shippingHouseNumber || "").trim(),
        shippingPostalCode: String(shippingPostalCode || "").trim(),
        shippingCity: String(shippingCity || "").trim(),
        shippingCountry: String(shippingCountry || "").trim(),
      };

      await readJson(
        await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })
      );

      window.location.href = "/app/dashboard";
    } catch (e) {
      setErr(e?.message || "Account aanmaken mislukt.");
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
          Account aanmaken
        </Typography>

        <Typography color="text.secondary">
          Maak een nieuwe omgeving aan voor je bedrijf.
        </Typography>
      </Box>

      {err ? <Alert severity="error">{err}</Alert> : null}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <Typography variant="h6" fontWeight={800}>
            Account
          </Typography>

          <TextField
            label="Bedrijfsnaam"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            fullWidth
            InputLabelProps={{ sx: hiddenAsteriskSx }}
          />

          <TextField
            label="Contactnaam"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            required
            fullWidth
            InputLabelProps={{ sx: hiddenAsteriskSx }}
          />

          <TextField
            label="E-mailadres"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            InputLabelProps={{ sx: hiddenAsteriskSx }}
          />

          <TextField
            label="Wachtwoord"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            helperText="Minstens 6 tekens."
            InputLabelProps={{ sx: hiddenAsteriskSx }}
          />

          <Typography variant="h6" fontWeight={800} sx={{ pt: 1 }}>
            Bedrijfsgegevens
          </Typography>

          <TextField
            label="BTW-nummer"
            value={vatNumber}
            onChange={(e) => setVatNumber(e.target.value)}
            required
            fullWidth
            InputLabelProps={{ sx: hiddenAsteriskSx }}
          />

          <TextField
            label="Telefoon"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            fullWidth
            InputLabelProps={{ sx: hiddenAsteriskSx }}
          />

          <Typography variant="h6" fontWeight={800} sx={{ pt: 1 }}>
            Facturatieadres
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                label="Straat"
                value={billingStreet}
                onChange={(e) => setBillingStreet(e.target.value)}
                required
                fullWidth
                InputLabelProps={{ sx: hiddenAsteriskSx }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Huisnummer"
                value={billingHouseNumber}
                onChange={(e) => setBillingHouseNumber(e.target.value)}
                required
                fullWidth
                InputLabelProps={{ sx: hiddenAsteriskSx }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Postcode"
                value={billingPostalCode}
                onChange={(e) => setBillingPostalCode(e.target.value)}
                required
                fullWidth
                InputLabelProps={{ sx: hiddenAsteriskSx }}
              />
            </Grid>

            <Grid item xs={12} md={8}>
              <TextField
                label="Gemeente"
                value={billingCity}
                onChange={(e) => setBillingCity(e.target.value)}
                required
                fullWidth
                InputLabelProps={{ sx: hiddenAsteriskSx }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Land"
                value={billingCountry}
                onChange={(e) => setBillingCountry(e.target.value)}
                fullWidth
                InputLabelProps={{ sx: hiddenAsteriskSx }}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" fontWeight={800} sx={{ pt: 1 }}>
            Leveringsadres
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={shippingSameAsBilling}
                onChange={(e) => setShippingSameAsBilling(e.target.checked)}
              />
            }
            label="Leveringsadres is hetzelfde als facturatieadres"
          />

          {!shippingSameAsBilling ? (
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TextField
                  label="Straat"
                  value={shippingStreet}
                  onChange={(e) => setShippingStreet(e.target.value)}
                  fullWidth
                  InputLabelProps={{ sx: hiddenAsteriskSx }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Huisnummer"
                  value={shippingHouseNumber}
                  onChange={(e) => setShippingHouseNumber(e.target.value)}
                  fullWidth
                  InputLabelProps={{ sx: hiddenAsteriskSx }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Postcode"
                  value={shippingPostalCode}
                  onChange={(e) => setShippingPostalCode(e.target.value)}
                  fullWidth
                  InputLabelProps={{ sx: hiddenAsteriskSx }}
                />
              </Grid>

              <Grid item xs={12} md={8}>
                <TextField
                  label="Gemeente"
                  value={shippingCity}
                  onChange={(e) => setShippingCity(e.target.value)}
                  fullWidth
                  InputLabelProps={{ sx: hiddenAsteriskSx }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Land"
                  value={shippingCountry}
                  onChange={(e) => setShippingCountry(e.target.value)}
                  fullWidth
                  InputLabelProps={{ sx: hiddenAsteriskSx }}
                />
              </Grid>
            </Grid>
          ) : null}

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
              mt: 1,
            }}
          >
            {saving ? "Account aanmaken..." : "Account aanmaken"}
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