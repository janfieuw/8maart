"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import QrCode2OutlinedIcon from "@mui/icons-material/QrCode2Outlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";

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

function StatCard({ title, value, icon }) {
  return (
    <Card sx={{ height: "100%", borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body1" color="text.secondary" fontWeight={500}>
              {title}
            </Typography>
            <Box sx={{ color: "#024659", display: "flex", alignItems: "center" }}>
              {icon}
            </Box>
          </Stack>

          <Typography variant="h3" fontWeight={800}>
            {value}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    employees: 0,
    scanTags: 0,
    registrations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [employeesRes, registrationsRes, accountRes] = await Promise.all([
          fetch("/api/employees", { cache: "no-store" }),
          fetch("/api/registrations", { cache: "no-store" }),
          fetch("/api/account", { cache: "no-store" }),
        ]);

        const [employeesData, registrationsData, accountData] = await Promise.all([
          readJson(employeesRes),
          readJson(registrationsRes),
          readJson(accountRes),
        ]);

        if (!active) return;

        const employees = Array.isArray(employeesData.rows) ? employeesData.rows : [];
        const registrations = Array.isArray(registrationsData.rows)
          ? registrationsData.rows
          : [];
        const scanTags = Array.isArray(accountData.scanTags) ? accountData.scanTags : [];

        setStats({
          employees: employees.length,
          scanTags: scanTags.length,
          registrations: registrations.length,
        });
      } catch (e) {
        if (!active) return;
        setError(e?.message || "Dashboard laden mislukt.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <Box>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Dashboard
          </Typography>
        </Box>

        {error ? <Alert severity="error">{error}</Alert> : null}

        {loading ? (
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <CircularProgress size={22} />
                <Typography>Dashboard laden...</Typography>
              </Stack>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <StatCard
                title="Werknemers"
                value={stats.employees}
                icon={<GroupOutlinedIcon />}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <StatCard
                title="QR-codes"
                value={stats.scanTags}
                icon={<QrCode2OutlinedIcon />}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <StatCard
                title="Registraties"
                value={stats.registrations}
                icon={<FactCheckOutlinedIcon />}
              />
            </Grid>
          </Grid>
        )}
      </Stack>
    </Box>
  );
}