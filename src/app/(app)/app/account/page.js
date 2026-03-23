"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const SHOW_SECTION_3_SCANTAGS = false;

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
    return new Date(value).toLocaleDateString("nl-BE");
  } catch {
    return "-";
  }
}

function copyToClipboard(value) {
  return navigator.clipboard.writeText(String(value || ""));
}

function TagCard({ tag, onCopy }) {
  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        p: 2,
        backgroundColor: "background.paper",
      }}
    >
      <Stack spacing={1.5}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
        >
          <Typography variant="subtitle1" fontWeight={700}>
            Scantag
          </Typography>

          <Chip
            label={tag?.direction || "-"}
            color={tag?.direction === "IN" ? "success" : "primary"}
            variant="outlined"
            size="small"
          />
        </Stack>

        <TextField
          label="Direction"
          value={tag?.direction || ""}
          fullWidth
          disabled
        />

        <TextField
          label="Secret"
          value={tag?.secret || ""}
          fullWidth
          disabled
        />

        <TextField
          label="Scan URL"
          value={tag?.scanUrl || ""}
          fullWidth
          disabled
        />

        <TextField
          label="Aangemaakt op"
          value={formatDate(tag?.createdAt)}
          fullWidth
          disabled
        />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button
            variant="outlined"
            onClick={() => onCopy(tag?.secret || "", "Secret gekopieerd.")}
            disabled={!tag?.secret}
          >
            Kopieer secret
          </Button>

          <Button
            variant="outlined"
            onClick={() => onCopy(tag?.scanUrl || "", "Scan URL gekopieerd.")}
            disabled={!tag?.scanUrl}
          >
            Kopieer URL
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingSubscription, setSavingSubscription] = useState(false);

  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [warning, setWarning] = useState(null);

  const [company, setCompany] = useState(null);
  const [scanTags, setScanTags] = useState([]);

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
      setScanTags(Array.isArray(data.scanTags) ? data.scanTags : []);

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
      setScanTags(Array.isArray(data.scanTags) ? data.scanTags : scanTags);
      setInfo("Bedrijfsgegevens opgeslagen.");
    } catch (e) {
      setErr(e?.message || "Opslaan van bedrijfsgegevens mislukt.");
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
      setScanTags(Array.isArray(data.scanTags) ? data.scanTags : scanTags);

      if (data.company?.subscriptionStatus === "INACTIVE") {
        setSubscriptionStatus("INACTIVE");
      } else {
        setSubscriptionStatus("ACTIVE");
      }

      setInfo("Abonnement opgeslagen.");
    } catch (e) {
      setErr(e?.message || "Opslaan van abonnement mislukt.");
    } finally {
      setSavingSubscription(false);
    }
  }

  async function handleCopy(value, successMessage) {
    try {
      await copyToClipboard(value);
      setInfo(successMessage);
      setErr("");
    } catch {
      setErr("Kopiëren mislukt.");
    }
  }

  const currentStatusLabel = useMemo(() => {
    return company?.subscriptionStatus || "-";
  }, [company]);

  const sortedTags = useMemo(() => {
    return [...scanTags].sort((a, b) => {
      const order = { IN: 0, OUT: 1 };
      return (order[a.direction] ?? 99) - (order[b.direction] ?? 99);
    });
  }, [scanTags]);

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
                  disabled={loading}
                />

                <TextField
                  label="BTW-nummer"
                  value={vatNumber}
                  fullWidth
                  disabled
                  helperText="Kan niet gewijzigd worden"
                />

                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    label="Straat"
                    value={billingStreet}
                    onChange={(e) => setBillingStreet(e.target.value)}
                    fullWidth
                    disabled={loading}
                  />
                  <TextField
                    label="Nummer"
                    value={billingHouseNumber}
                    onChange={(e) => setBillingHouseNumber(e.target.value)}
                    fullWidth
                    disabled={loading}
                  />
                </Stack>

                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    label="Postcode"
                    value={billingPostalCode}
                    onChange={(e) => setBillingPostalCode(e.target.value)}
                    fullWidth
                    disabled={loading}
                  />
                  <TextField
                    label="Gemeente"
                    value={billingCity}
                    onChange={(e) => setBillingCity(e.target.value)}
                    fullWidth
                    disabled={loading}
                  />
                </Stack>

                <TextField
                  label="Land"
                  value={billingCountry}
                  onChange={(e) => setBillingCountry(e.target.value)}
                  fullWidth
                  disabled={loading}
                />

                <TextField
                  label="E-mail"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  fullWidth
                  disabled={loading}
                />

                <TextField
                  label="Telefoon"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  fullWidth
                  disabled={loading}
                />

                <Box>
                  <Button
                    variant="contained"
                    onClick={saveCompany}
                    disabled={loading || savingCompany}
                  >
                    {savingCompany ? "Opslaan..." : "Opslaan"}
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
                  disabled
                />

                <TextField
                  label="Huidige status"
                  value={currentStatusLabel}
                  fullWidth
                  disabled
                />

                <TextField
                  select
                  label="Wijzig status"
                  value={subscriptionStatus}
                  onChange={(e) => setSubscriptionStatus(e.target.value)}
                  fullWidth
                  disabled={loading}
                >
                  <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                  <MenuItem value="INACTIVE">INACTIVE</MenuItem>
                </TextField>

                <TextField
                  label="Trial start"
                  value={formatDate(company?.trialStartsAt)}
                  fullWidth
                  disabled
                />

                <TextField
                  label="Trial einde"
                  value={formatDate(company?.trialEndsAt)}
                  fullWidth
                  disabled
                />

                <TextField
                  label="Activatie datum"
                  value={formatDate(company?.activatedAt)}
                  fullWidth
                  disabled
                />

                <TextField
                  label="Volgende verlenging"
                  value={formatDate(company?.nextRenewalAt)}
                  fullWidth
                  disabled
                />

                <Box>
                  <Button
                    variant="contained"
                    onClick={saveSubscription}
                    disabled={loading || savingSubscription}
                  >
                    {savingSubscription ? "Opslaan..." : "Opslaan"}
                  </Button>
                </Box>
              </Stack>
            </Box>

            {SHOW_SECTION_3_SCANTAGS ? (
              <>
                <Divider />

                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Sectie 3 — Scantags
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Deze scantags worden automatisch aangemaakt voor je bedrijf.
                  </Typography>

                  {sortedTags.length === 0 ? (
                    <Alert severity="warning">
                      Geen scantags gevonden voor dit bedrijf.
                    </Alert>
                  ) : (
                    <Stack spacing={2}>
                      {sortedTags.map((tag) => (
                        <TagCard
                          key={tag.id}
                          tag={tag}
                          onCopy={handleCopy}
                        />
                      ))}
                    </Stack>
                  )}
                </Box>
              </>
            ) : null}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}