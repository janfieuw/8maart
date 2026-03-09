"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import RefreshIcon from "@mui/icons-material/Refresh";

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

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [stats, setStats] = useState({
    employees: 0,
    activeEmployees: 0,
    scanLocations: 0,
    registrations: 0,
  });

  async function loadDashboard() {
    setLoading(true);
    setErr("");

    try {
      const [employeesRes, scanLocationsRes, registrationsRes] = await Promise.all([
        fetch("/api/employees", { cache: "no-store" }),
        fetch("/api/scan-locations", { cache: "no-store" }),
        fetch("/api/registrations", { cache: "no-store" }),
      ]);

      const [employeesData, scanLocationsData, registrationsData] = await Promise.all([
        readJson(employeesRes),
        readJson(scanLocationsRes),
        readJson(registrationsRes),
      ]);

      const employees = Array.isArray(employeesData.rows) ? employeesData.rows : [];
      const scanLocations = Array.isArray(scanLocationsData.rows) ? scanLocationsData.rows : [];
      const registrations = Array.isArray(registrationsData.rows) ? registrationsData.rows : [];

      setStats({
        employees: employees.length,
        activeEmployees: employees.filter((e) => e.active).length,
        scanLocations: scanLocations.length,
        registrations: registrations.length,
      });
    } catch (e) {
      setErr(e?.message || "Dashboard laden mislukt.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const cards = [
    {
      label: "Werknemers",
      value: stats.employees,
      sub: `${stats.activeEmployees} actief`,
      icon: <GroupsIcon fontSize="large" />,
      href: "/app/employees",
    },
    {
      label: "Scanlocaties",
      value: stats.scanLocations,
      sub: "IN / OUT QR’s",
      icon: <QrCode2Icon fontSize="large" />,
      href: "/app/tags",
    },
    {
      label: "Registraties",
      value: stats.registrations,
      sub: "Alle scans",
      icon: <FactCheckIcon fontSize="large" />,
      href: "/app/registrations",
    },
  ];

  return (
    <Box>
      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="h4" fontWeight={800}>
                  Dashboard
                </Typography>
                <Typography color="text.secondary">
                  Overzicht van je Punctoo-omgeving
                </Typography>
              </Box>

              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={loadDashboard}
                disabled={loading}
              >
                Verversen
              </Button>
            </Stack>

            {err ? <Alert severity="error">{err}</Alert> : null}

            <Grid container spacing={2}>
              {cards.map((card) => (
                <Grid item xs={12} md={4} key={card.label}>
                  <Card variant="outlined" sx={{ height: "100%" }}>
                    <CardContent>
                      <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="h6" fontWeight={700}>
                            {card.label}
                          </Typography>
                          {card.icon}
                        </Stack>

                        <Typography variant="h3" fontWeight={900}>
                          {loading ? "…" : card.value}
                        </Typography>

                        <Typography color="text.secondary">{card.sub}</Typography>

                        <Button component={Link} href={card.href} variant="outlined">
                          Openen
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}