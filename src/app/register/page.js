"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
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

export default function RegisterPage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

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

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setErr("");

    try {
      await readJson(
        await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName,
            contactName,
            email,
            password,
            vatNumber,
            phone,
            billingStreet,
            billingHouseNumber,
            billingPostalCode,
            billingCity,
            billingCountry,
            shippingSameAsBilling,
            shippingStreet,
            shippingHouseNumber,
            shippingPostalCode,
            shippingCity,
            shippingCountry,
          }),
        })
      );

      router.push("/app/employees");
    } catch (e2) {
      setErr(e2?.message || "Registratie mislukt.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "#f6f6f6", py: 6, px: 2 }}>
      <Box sx={{ maxWidth: 860, mx: "auto" }}>
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h3" fontWeight={900}>
                  Punctoo registreren
                </Typography>
                <Typography color="text.secondary">
                  Maak je bedrijf en account aan
                </Typography>
              </Box>

              {err ? <Alert severity="error">{err}</Alert> : null}

              <Box component="form" onSubmit={submit}>
                <Stack spacing={3}>
                  <Typography variant="h6" fontWeight={800}>
                    Account
                  </Typography>

                  <TextField label="Contactnaam" value={contactName} onChange={(e) => setContactName(e.target.value)} fullWidth />
                  <TextField label="E-mailadres" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
                  <TextField label="Wachtwoord" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth />

                  <Typography variant="h6" fontWeight={800}>
                    Bedrijf
                  </Typography>

                  <TextField label="Bedrijfsnaam" value={companyName} onChange={(e) => setCompanyName(e.target.value)} fullWidth />
                  <TextField label="BTW nummer" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} fullWidth />
                  <TextField label="Telefoonnummer" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth />

                  <Typography variant="h6" fontWeight={800}>
                    Facturatieadres
                  </Typography>

                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField label="Straat" value={billingStreet} onChange={(e) => setBillingStreet(e.target.value)} fullWidth />
                    <TextField label="Nr" value={billingHouseNumber} onChange={(e) => setBillingHouseNumber(e.target.value)} sx={{ width: 120 }} />
                  </Stack>

                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField label="Postcode" value={billingPostalCode} onChange={(e) => setBillingPostalCode(e.target.value)} />
                    <TextField label="Gemeente" value={billingCity} onChange={(e) => setBillingCity(e.target.value)} fullWidth />
                    <TextField label="Land" value={billingCountry} onChange={(e) => setBillingCountry(e.target.value)} />
                  </Stack>

                  <Typography variant="h6" fontWeight={800}>
                    Leveringsadres ScanTags
                  </Typography>

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={shippingSameAsBilling}
                        onChange={(e) => setShippingSameAsBilling(e.target.checked)}
                      />
                    }
                    label="Zelfde als facturatieadres"
                  />

                  {!shippingSameAsBilling ? (
                    <>
                      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                        <TextField label="Straat" value={shippingStreet} onChange={(e) => setShippingStreet(e.target.value)} fullWidth />
                        <TextField label="Nr" value={shippingHouseNumber} onChange={(e) => setShippingHouseNumber(e.target.value)} sx={{ width: 120 }} />
                      </Stack>

                      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                        <TextField label="Postcode" value={shippingPostalCode} onChange={(e) => setShippingPostalCode(e.target.value)} />
                        <TextField label="Gemeente" value={shippingCity} onChange={(e) => setShippingCity(e.target.value)} fullWidth />
                        <TextField label="Land" value={shippingCountry} onChange={(e) => setShippingCountry(e.target.value)} />
                      </Stack>
                    </>
                  ) : null}

                  <Stack direction="row" spacing={2}>
                    <Button type="submit" variant="contained" disabled={saving}>
                      {saving ? "Bezig..." : "Account aanmaken"}
                    </Button>

                    <Button component={Link} href="/login" variant="text">
                      Ik heb al een account
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