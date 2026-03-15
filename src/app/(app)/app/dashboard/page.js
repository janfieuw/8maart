import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  buildEmployeeBalances,
  formatBalanceMinutes,
} from "@/lib/work-balance";

import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PersonOffOutlinedIcon from "@mui/icons-material/PersonOffOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";

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

function formatDate(value) {
  const date = new Date(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month} - ${hours}:${minutes}`;
}

function groupLatestScanByEmployee(scans) {
  const latest = {};

  for (const scan of scans) {
    if (!latest[scan.employeeId]) {
      latest[scan.employeeId] = scan;
    }
  }

  return latest;
}

function buildScanLines(scans, employeesById, type) {
  return scans
    .filter((scan) => scan.type === type)
    .map((scan) => {
      const employee = employeesById.get(scan.employeeId);

      return {
        id: scan.id,
        primary: employee?.name || "ONBEKEND",
        secondary: formatDate(scan.scannedAt),
      };
    });
}

function buildStatusLines(employees, latestScanByEmployee) {
  const working = [];
  const absent = [];

  for (const employee of employees) {
    const latest = latestScanByEmployee[employee.id];

    if (!latest || latest.type === "OUT") {
      absent.push({
        id: employee.id,
        primary: employee.name,
        secondary: latest
          ? `Laatste OUT: ${formatDate(latest.scannedAt)}`
          : "Nog geen scans",
      });
    } else {
      working.push({
        id: employee.id,
        primary: employee.name,
        secondary: `Laatste IN: ${formatDate(latest.scannedAt)}`,
      });
    }
  }

  return { working, absent };
}

function DashboardPanel({
  title,
  count,
  items,
  borderColor,
  chipBg,
  chipColor,
  iconBg,
  iconColor,
  icon,
}) {
  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: "28px",
        border: `1px solid ${borderColor}`,
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
        backgroundColor: "#ffffff",
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 12px 28px rgba(15, 23, 42, 0.10)",
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2.25}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={1.5}
          >
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
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
                  fontSize: "1.2rem",
                  fontWeight: 800,
                  color: "#111827",
                  lineHeight: 1.2,
                }}
              >
                {title}
              </Typography>
            </Stack>

            <Chip
              label={count}
              size="small"
              sx={{
                backgroundColor: chipBg,
                color: chipColor,
                fontWeight: 700,
                minWidth: 38,
              }}
            />
          </Stack>

          {items.length > 0 ? (
            <Stack divider={<Divider flexItem sx={{ borderColor: "#eef2f7" }} />}>
              {items.map((item) => (
                <Box key={item.id} sx={{ py: 1.2 }}>
                  <Typography
                    sx={{
                      fontSize: "1rem",
                      lineHeight: 1.35,
                      color: "#111827",
                      fontWeight: 600,
                    }}
                  >
                    {item.primary}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: "0.84rem",
                      lineHeight: 1.35,
                      color: "#6b7280",
                      mt: 0.35,
                    }}
                  >
                    {item.secondary}
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography
              sx={{
                fontSize: "0.95rem",
                color: "#6b7280",
                fontStyle: "italic",
                pt: 0.5,
              }}
            >
              Geen gegevens
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function WorkBalanceTile({ name, balanceMinutes }) {
  const color =
    balanceMinutes > 0
      ? "#1f7a45"
      : balanceMinutes < 0
      ? "#a33a3a"
      : "#6b7280";

  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: "24px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
        backgroundColor: "#ffffff",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={1}>
          <Typography
            sx={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "#111827",
              lineHeight: 1.3,
            }}
          >
            {name}
          </Typography>

          <Typography
            sx={{
              fontSize: "1.45rem",
              fontWeight: 800,
              color,
              lineHeight: 1.2,
            }}
          >
            {formatBalanceMinutes(balanceMinutes)}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.companyId) {
    redirect("/login");
  }

  const companyId = session.companyId;

  const employees = await prisma.employee.findMany({
    where: {
      companyId,
      active: true,
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      dailyMinutes: true,
    },
  });

  const scans = await prisma.scanEvent.findMany({
    where: {
      companyId,
    },
    orderBy: { scannedAt: "desc" },
    select: {
      id: true,
      employeeId: true,
      type: true,
      scannedAt: true,
    },
  });

  const employeesById = new Map(
    employees.map((employee) => [employee.id, employee])
  );

  const latestScanByEmployee = groupLatestScanByEmployee(scans);
  const { working, absent } = buildStatusLines(employees, latestScanByEmployee);
  const latestIns = buildScanLines(scans, employeesById, "IN");
  const latestOuts = buildScanLines(scans, employeesById, "OUT");

  const balances = buildEmployeeBalances({
    employees,
    scans,
    defaultDailyMinutes: 8 * 60,
  });

  return (
    <Box sx={{ px: { xs: 1, md: 2 }, py: 1 }}>
      <Stack spacing={4}>
        <Box>
          <Typography
            sx={{
              fontSize: { xs: "2rem", md: "2.6rem" },
              fontWeight: 800,
              color: "#111827",
              lineHeight: 1.1,
              mb: 0.75,
            }}
          >
            Dashboard
          </Typography>

          <Typography
            sx={{
              fontSize: "1rem",
              color: "#6b7280",
            }}
          >
            Overzicht van aanwezigheid en alle laatste scans
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6} xl={3}>
            <DashboardPanel
              title="Aan het werk"
              count={working.length}
              items={working}
              borderColor="#cfe8db"
              chipBg="#e8f6ee"
              chipColor="#1f7a45"
              iconBg="#e8f6ee"
              iconColor="#1f7a45"
              icon={<PeopleAltOutlinedIcon fontSize="small" />}
            />
          </Grid>

          <Grid item xs={12} md={6} xl={3}>
            <DashboardPanel
              title="Afwezig"
              count={absent.length}
              items={absent}
              borderColor="#ead7d7"
              chipBg="#fbebeb"
              chipColor="#a33a3a"
              iconBg="#fbebeb"
              iconColor="#a33a3a"
              icon={<PersonOffOutlinedIcon fontSize="small" />}
            />
          </Grid>

          <Grid item xs={12} md={6} xl={3}>
            <DashboardPanel
              title="Laatste IN"
              count={latestIns.length}
              items={latestIns}
              borderColor="#d9e6f5"
              chipBg="#eef5fc"
              chipColor="#255b92"
              iconBg="#eef5fc"
              iconColor="#255b92"
              icon={<LoginOutlinedIcon fontSize="small" />}
            />
          </Grid>

          <Grid item xs={12} md={6} xl={3}>
            <DashboardPanel
              title="Laatste OUT"
              count={latestOuts.length}
              items={latestOuts}
              borderColor="#e8dff4"
              chipBg="#f5f1fb"
              chipColor="#6f42b5"
              iconBg="#f5f1fb"
              iconColor="#6f42b5"
              icon={<LogoutOutlinedIcon fontSize="small" />}
            />
          </Grid>
        </Grid>

        <Box>
          <Typography
            sx={{
              fontSize: "1.35rem",
              fontWeight: 800,
              color: "#111827",
              mb: 2,
            }}
          >
            Work balance
          </Typography>

          <Grid container spacing={3}>
            {balances.map((employee) => (
              <Grid key={employee.employeeId} item xs={12} sm={6} md={4} xl={3}>
                <WorkBalanceTile
                  name={employee.name}
                  balanceMinutes={employee.balanceMinutes}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Stack>
    </Box>
  );
}