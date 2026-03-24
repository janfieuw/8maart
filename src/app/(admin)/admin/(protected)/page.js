import { redirect } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import HourglassBottomOutlinedIcon from "@mui/icons-material/HourglassBottomOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "../_lib/adminAuth.js";

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);
  return new Intl.DateTimeFormat("nl-BE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function StatCard({
  title,
  value,
  icon,
  borderColor,
  chipBg,
  chipColor,
  iconBg,
  iconColor,
}) {
  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: "28px",
        border: `1px solid ${borderColor}`,
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
        backgroundColor: "#ffffff",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={1.5}
        >
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: iconBg,
                color: iconColor,
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>

            <Typography
              sx={{
                fontSize: "1.05rem",
                fontWeight: 800,
                color: "#111827",
                lineHeight: 1.2,
              }}
            >
              {title}
            </Typography>
          </Stack>

          <Chip
            label={value}
            size="small"
            sx={{
              backgroundColor: chipBg,
              color: chipColor,
              fontWeight: 700,
              minWidth: 44,
            }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboardPage() {
  const session = await getAdminSession();

  if (!session?.email) {
    redirect("/admin/login");
  }

  const [
    totalCustomers,
    activeCustomers,
    trialCustomers,
    inactiveCustomers,
    totalEmployees,
    recentCustomers,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.company.count({ where: { subscriptionStatus: "ACTIVE" } }),
    prisma.company.count({ where: { subscriptionStatus: "TRIAL" } }),
    prisma.company.count({ where: { subscriptionStatus: "INACTIVE" } }),
    prisma.employee.count(),
    prisma.company.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        slug: true,
        contactEmail: true,
        subscriptionStatus: true,
        createdAt: true,
        _count: {
          select: {
            employees: true,
          },
        },
      },
    }),
  ]);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" fontWeight={800} color="#111827" sx={{ mb: 1 }}>
          Dashboard
        </Typography>
        <Typography color="text.secondary">
          Overzicht van klanten en werknemers in het Punctoo-platform.
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6} xl={3}>
          <StatCard
            title="Totaal klanten"
            value={totalCustomers}
            icon={<BusinessOutlinedIcon />}
            borderColor="#d6e4ea"
            chipBg="#e8f2f5"
            chipColor="#024659"
            iconBg="#e8f2f5"
            iconColor="#024659"
          />
        </Grid>

        <Grid item xs={12} md={6} xl={3}>
          <StatCard
            title="Actieve klanten"
            value={activeCustomers}
            icon={<CheckCircleOutlineOutlinedIcon />}
            borderColor="#d8eadf"
            chipBg="#edf7f1"
            chipColor="#1f6b3b"
            iconBg="#edf7f1"
            iconColor="#1f6b3b"
          />
        </Grid>

        <Grid item xs={12} md={6} xl={3}>
          <StatCard
            title="Trial klanten"
            value={trialCustomers}
            icon={<HourglassBottomOutlinedIcon />}
            borderColor="#efe5cd"
            chipBg="#f7f0df"
            chipColor="#8a6a12"
            iconBg="#f7f0df"
            iconColor="#8a6a12"
          />
        </Grid>

        <Grid item xs={12} md={6} xl={3}>
          <StatCard
            title="Inactieve klanten"
            value={inactiveCustomers}
            icon={<BlockOutlinedIcon />}
            borderColor="#f0d7d7"
            chipBg="#f9ecec"
            chipColor="#9b2c2c"
            iconBg="#f9ecec"
            iconColor="#9b2c2c"
          />
        </Grid>

        <Grid item xs={12} md={6} xl={3}>
          <StatCard
            title="Totaal werknemers"
            value={totalEmployees}
            icon={<GroupsOutlinedIcon />}
            borderColor="#dfe4f3"
            chipBg="#eef1fa"
            chipColor="#334a9b"
            iconBg="#eef1fa"
            iconColor="#334a9b"
          />
        </Grid>
      </Grid>

      <Card
        sx={{
          borderRadius: "28px",
          border: "1px solid #dde3e8",
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h6" fontWeight={800}>
                Recent toegevoegde klanten
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                Laatst aangemaakte bedrijven in het platform.
              </Typography>
            </Box>

            {recentCustomers.length > 0 ? (
              <Stack divider={<Divider flexItem sx={{ borderColor: "#eef2f7" }} />}>
                {recentCustomers.map((company) => (
                  <Box
                    key={company.id}
                    sx={{
                      py: 1.3,
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1.5,
                    }}
                  >
                    <Box>
                      <Typography fontWeight={700} color="#111827">
                        {company.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {company.contactEmail || "Geen e-mailadres"} · {company.slug}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                      <Chip
                        label={company.subscriptionStatus}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          backgroundColor: "#f1f3f5",
                        }}
                      />

                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <PersonOutlineOutlinedIcon sx={{ fontSize: 18, color: "#6b7280" }} />
                        <Typography variant="body2" color="text.secondary">
                          {company._count.employees}
                        </Typography>
                      </Stack>

                      <Typography variant="body2" color="text.secondary">
                        {formatDateTime(company.createdAt)}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">Nog geen klanten gevonden.</Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}