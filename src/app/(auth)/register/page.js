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

function toUpper(value) {
  return String(value || "").toUpperCase();
}

function formatVatNumber(value) {
  const digits = String(value || "")
    .replace(/\D/g, "")
    .slice(0, 10);

  let formatted = "";

  if (digits.length > 0) formatted += digits.slice(0, 1);
  if (digits.length > 1) formatted += `.${digits.slice(1, 4)}`;
  if (digits.length > 4) formatted += `.${digits.slice(4, 7)}`;
  if (digits.length > 7) formatted += `.${digits.slice(7, 10)}`;

  return formatted;
}

const subtleLabelSx = {
  fontSize: "0.85rem",
  mb: 0.6,
  color: "#374151",
  fontWeight: 500,
};

const inputSx = {
  backgroundColor: "#ffffff",
  borderRadius: 2,
};

function Field({ label, children }) {
  return (
    <Box>
      <Typography sx={subtleLabelSx}>{label}</Typography>
      {children}
    </Box>
  );
}

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
  const [billingCountry, setBillingCountry] = useState("BELGIË");

  const [shippingSameAsBilling, setShippingSameAsBilling] = useState(true);
  const [shippingStreet, setShippingStreet] = useState("");
  const [shippingHouseNumber, setShippingHouseNumber] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingCountry, setShippingCountry] = useState("BELGIË");

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
          headers: { "Content-Type": "application/json" },
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

        <Typography
          sx={{
            fontSize: "0.8rem",
            color: "#6b7280",
            mb: 1,
          }}
        >
          De gegevens worden automatisch omgezet in hoofdletters
        </Typography>
      </Box>

      {err ? <Alert severity="error">{err}</Alert> : null}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <Typography variant="h6" fontWeight={800}>
            Account
          </Typography>

          <Field label="Bedrijfsnaam">
            <TextField
              fullWidth
              value={companyName}
              onChange={(e) => setCompanyName(toUpper(e.target.value))}
              required
              autoComplete="organization"
              InputProps={{ sx: inputSx }}
            />
          </Field>

          <Field label="Contactnaam">
            <TextField
              fullWidth
              value={contactName}
              onChange={(e) => setContactName(toUpper(e.target.value))}
              required
              autoComplete="name"
              InputProps={{ sx: inputSx }}
            />
          </Field>

          <Field label="E-mailadres">
            <TextField
              fullWidth
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              InputProps={{ sx: inputSx }}
            />
          </Field>

          <Field label="Wachtwoord">
            <TextField
              fullWidth
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              helperText="Minstens 6 tekens."
              InputProps={{ sx: inputSx }}
            />
          </Field>

          <Typography variant="h6" fontWeight={800}>
            Bedrijfsgegevens
          </Typography>

          <Field label="BTW-nummer (formaat 0.xxx.xxx.xxx)">
            <TextField
              fullWidth
              value={vatNumber}
              onChange={(e) => setVatNumber(formatVatNumber(e.target.value))}
              required
              placeholder="0.123.456.789"
              inputMode="numeric"
              InputProps={{ sx: inputSx }}
            />
          </Field>

          <Field label="Telefoon">
            <TextField
              fullWidth
              value={phone}
              onChange={(e) => setPhone(toUpper(e.target.value))}
              autoComplete="tel"
              InputProps={{ sx: inputSx }}
            />
          </Field>

          <Typography variant="h6" fontWeight={800}>
            Facturatieadres
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Field label="Straat">
                <TextField
                  fullWidth
                  value={billingStreet}
                  onChange={(e) => setBillingStreet(toUpper(e.target.value))}
                  required
                  autoComplete="address-line1"
                  InputProps={{ sx: inputSx }}
                />
              </Field>
            </Grid>

            <Grid item xs={12}>
              <Field label="Huisnummer">
                <TextField
                  fullWidth
                  value={billingHouseNumber}
                  onChange={(e) =>
                    setBillingHouseNumber(toUpper(e.target.value))
                  }
                  required
                  InputProps={{ sx: inputSx }}
                />
              </Field>
            </Grid>

            <Grid item xs={12}>
              <Field label="Postcode">
                <TextField
                  fullWidth
                  value={billingPostalCode}
                  onChange={(e) =>
                    setBillingPostalCode(toUpper(e.target.value))
                  }
                  required
                  autoComplete="postal-code"
                  InputProps={{ sx: inputSx }}
                />
              </Field>
            </Grid>

            <Grid item xs={12}>
              <Field label="Gemeente">
                <TextField
                  fullWidth
                  value={billingCity}
                  onChange={(e) => setBillingCity(toUpper(e.target.value))}
                  required
                  autoComplete="address-level2"
                  InputProps={{ sx: inputSx }}
                />
              </Field>
            </Grid>

            <Grid item xs={12}>
              <Field label="Land">
                <TextField
                  fullWidth
                  value={billingCountry}
                  onChange={(e) => setBillingCountry(toUpper(e.target.value))}
                  autoComplete="country-name"
                  InputProps={{ sx: inputSx }}
                />
              </Field>
            </Grid>
          </Grid>

          <Typography variant="h6" fontWeight={800}>
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
              <Grid item xs={12}>
                <Field label="Straat">
                  <TextField
                    fullWidth
                    value={shippingStreet}
                    onChange={(e) => setShippingStreet(toUpper(e.target.value))}
                    autoComplete="address-line1"
                    InputProps={{ sx: inputSx }}
                  />
                </Field>
              </Grid>

              <Grid item xs={12}>
                <Field label="Huisnummer">
                  <TextField
                    fullWidth
                    value={shippingHouseNumber}
                    onChange={(e) =>
                      setShippingHouseNumber(toUpper(e.target.value))
                    }
                    InputProps={{ sx: inputSx }}
                  />
                </Field>
              </Grid>

              <Grid item xs={12}>
                <Field label="Postcode">
                  <TextField
                    fullWidth
                    value={shippingPostalCode}
                    onChange={(e) =>
                      setShippingPostalCode(toUpper(e.target.value))
                    }
                    autoComplete="postal-code"
                    InputProps={{ sx: inputSx }}
                  />
                </Field>
              </Grid>

              <Grid item xs={12}>
                <Field label="Gemeente">
                  <TextField
                    fullWidth
                    value={shippingCity}
                    onChange={(e) => setShippingCity(toUpper(e.target.value))}
                    autoComplete="address-level2"
                    InputProps={{ sx: inputSx }}
                  />
                </Field>
              </Grid>

              <Grid item xs={12}>
                <Field label="Land">
                  <TextField
                    fullWidth
                    value={shippingCountry}
                    onChange={(e) =>
                      setShippingCountry(toUpper(e.target.value))
                    }
                    autoComplete="country-name"
                    InputProps={{ sx: inputSx }}
                  />
                </Field>
              </Grid>
            </Grid>
          ) : null}

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={saving}
            sx={{
              minHeight: 52,
              borderRadius: 3,
              fontWeight: 700,
              mt: 2,
            }}
          >
            {saving ? "Account aanmaken..." : "ACCOUNT AANMAKEN"}
          </Button>

          <Typography sx={{ fontSize: "0.95rem", color: "#374151" }}>
            Heb je al een account?{" "}
            <Link
              href="/login"
              style={{
                color: "#2e8b57",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              INLOGGEN
            </Link>
          </Typography>
        </Stack>
      </Box>
    </Stack>
  );
}