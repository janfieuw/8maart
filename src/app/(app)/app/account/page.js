"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  MenuItem,
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

function formatDate(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return "-";
  }
}

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingSubscription, setSavingSubscription] = useState(false);

  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [warning, setWarning] = useState(null);

  const [company, setCompany] = useState(null);

  const [name, setName] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [billingStreet, setBillingStreet] = useState("");
  const [billingHouseNumber, setBillingHouseNumber] = useState("");
  const [billingPostalCode, setBillingPostalCode] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingCountry, setBillingCountry] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [subscriptionStatus, setSubscriptionStatus] = useState("ACTIVE");

  async function loadAccount() {
    setLoading(true);
    setErr("");
    setInfo("");

    try {
      const res = await fetch("/api/account", {
        cache: "no-store",
      });

      const data = await readJson(res);
      const c = data.company;

      setCompany(c);
      setWarning(data.warning || null);

      setName(c?.name || "");
      setVatNumber(c?.vatNumber || "");
      setBillingStreet(c?.billingStreet || "");
      setBillingHouseNumber(c?.billingHouseNumber || "");
      setBillingPostalCode(c?.billingPostalCode || "");
      setBillingCity(c?.billingCity || "");
      setBillingCountry(c?.billingCountry || "");
      setContactEmail(c?.contactEmail || "");
      setPhone(c?.phone || "");

      if (c?.subscriptionStatus === "INACTIVE") {
        setSubscriptionStatus("INACTIVE");
      } else {
        setSubscriptionStatus("ACTIVE");
      }
    } catch (e) {
      setErr(e?.message || "Account laden mislukt.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAccount();
  }, []);

  async function saveCompany() {
    setSavingCompany(true);
    setErr("");
    setInfo("");

    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "company",
          name,
          billingStreet,
          billingHouseNumber,
          billingPostalCode,
          billingCity,
          billingCountry,
          contactEmail,
          phone,
        }),
      });

      const data = await readJson(res);

      setCompany(data.company);
      setWarning(data.warning || null);
      setInfo("Bedrijfsgegevens opgeslagen.");
    } catch (e) {
      setErr(e?.message || "Opslaan bedrijfsgegevens mislukt.");
    } finally {
      setSavingCompany(false);
    }
  }

  async function saveSubscription() {
    setSavingSubscription(true);
    setErr("");
    setInfo("");

    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "subscription",
          subscriptionStatus,
        }),
      });

      const data = await readJson(res);

      setCompany(data.company);
      setWarning(data.warning || null);

      if (data.company?.subscriptionStatus === "INACTIVE") {
        setSubscriptionStatus("INACTIVE");
      } else {
        setSubscriptionStatus("ACTIVE");
      }

      setInfo("Abonnement opgeslagen.");
    } catch (e) {
      setErr(e?.message || "Opslaan abonnement mislukt.");
    } finally {
      setSavingSubscription(false);
    }
  }

  const currentStatusLabel = useMemo(() => {
    return company?.subscriptionStatus || "-";
  }, [company]);

  return (
    <Box>
      <Card>
        <CardContent>
          <Stack spacing={4}>
            <Box>
              <Typography variant="h4" fontWeight={800}>
                Account
              </Typography>
            </Box>

            {warning ? (
              <Alert severity={warning.level === "error" ? "error" : "warning"}>
                {warning.message}
              </Alert>
            ) : null}

            {err ? <Alert severity="error">{err}</Alert> : null}
            {info ? <Alert severity="success">{info}</Alert> : null}

            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Sectie 1 — Bedrijfsgegevens
              </Typography>

              <Stack spacing={2} sx={{ mt: 2 }}>
                <TextField
                  label="Bedrijfsnaam"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                />

                <TextField
                  label="BTW-nummer"
                  value={vatNumber}
                  fullWidth
                  InputProps={{ readOnly: true }}
                  helperText="Kan niet gewijzigd worden"
                />

                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    label="Straat"
                    value={billingStreet}
                    onChange={(e) => setBillingStreet(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Nummer"
                    value={billingHouseNumber}
                    onChange={(e) => setBillingHouseNumber(e.target.value)}
                    fullWidth
                  />
                </Stack>

                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    label="Postcode"
                    value={billingPostalCode}
                    onChange={(e) => setBillingPostalCode(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Gemeente"
                    value={billingCity}
                    onChange={(e) => setBillingCity(e.target.value)}
                    fullWidth
                  />
                </Stack>

                <TextField
                  label="Land"
                  value={billingCountry}
                  onChange={(e) => setBillingCountry(e.target.value)}
                  fullWidth
                />

                <TextField
                  label="E-mail"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  fullWidth
                />

                <TextField
                  label="Telefoon"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  fullWidth
                />

                <Box>
                  <Button
                    variant="contained"
                    onClick={saveCompany}
                    disabled={loading || savingCompany}
                  >
                    {savingCompany ? "Opslaan..." : "Save to confirm"}
                  </Button>
                </Box>
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Sectie 2 — Abonnement
              </Typography>

              <Stack spacing={2} sx={{ mt: 2 }}>
                <TextField
                  label="Abonnementsnummer"
                  value={company?.subscriptionNumber || ""}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />

                <TextField
                  label="Huidige status"
                  value={currentStatusLabel}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />

                <TextField
                  select
                  label="Wijzig status"
                  value={subscriptionStatus}
                  onChange={(e) => setSubscriptionStatus(e.target.value)}
                  fullWidth
                >
                  <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                  <MenuItem value="INACTIVE">INACTIVE</MenuItem>
                </TextField>

                <TextField
                  label="Trial start"
                  value={formatDate(company?.trialStartsAt)}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />

                <TextField
                  label="Trial einde"
                  value={formatDate(company?.trialEndsAt)}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />

                <TextField
                  label="First active"
                  value={formatDate(company?.activatedAt)}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />

                <TextField
                  label="Volgende verlenging"
                  value={formatDate(company?.nextRenewalAt)}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />

                <Box>
                  <Button
                    variant="contained"
                    onClick={saveSubscription}
                    disabled={loading || savingSubscription}
                  >
                    {savingSubscription ? "Opslaan..." : "Save to confirm"}
                  </Button>
                </Box>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}