import { prisma } from "@/lib/prisma";
import { Box, Card, CardContent, Chip, Grid, Stack, Typography } from "@mui/material";

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
        label: `${formatDate(scan.scannedAt)} - ${employee?.name || "ONBEKEND"}`,
      };
    });
}

function DashboardPanel({
  title,
  count,
  items,
  borderColor,
  chipBg,
  chipColor,
}) {
  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: 4,
        border: `1px solid ${borderColor}`,
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
        backgroundColor: "#ffffff",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Typography
              sx={{
                fontSize: "1.2rem",
                fontWeight: 800,
                color: "#111827",
              }}
            >
              {title}
            </Typography>

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
            <Stack spacing={1.25}>
              {items.map((item, index) => (
                <Typography
                  key={item.id || `${title}-${index}`}
                  sx={{
                    fontSize: "0.98rem",
                    lineHeight: 1.45,
                    color: "#1f2937",
                  }}
                >
                  {item.label || item}
                </Typography>
              ))}
            </Stack>
          ) : (
            <Typography
              sx={{
                fontSize: "0.95rem",
                color: "#6b7280",
                fontStyle: "italic",
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

export default async function DashboardPage() {
  const employees = await prisma.employee.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      companyId: true,
    },
  });

  const scans = await prisma.scanEvent.findMany({
    orderBy: { scannedAt: "desc" },
    select: {
      id: true,
      employeeId: true,
      type: true,
      scannedAt: true,
      companyId: true,
    },
  });

  const employeesById = new Map(employees.map((employee) => [employee.id, employee]));
  const latestScanByEmployee = groupLatestScanByEmployee(scans);

  const workingNow = [];
  const absentNow = [];

  for (const employee of employees) {
    const latest = latestScanByEmployee[employee.id];

    if (!latest || latest.type === "OUT") {
      absentNow.push({
        id: employee.id,
        label: employee.name,
      });
    } else {
      workingNow.push({
        id: employee.id,
        label: employee.name,
      });
    }
  }

  const latestIns = buildScanLines(scans, employeesById, "IN");
  const latestOuts = buildScanLines(scans, employeesById, "OUT");

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
              count={workingNow.length}
              items={workingNow}
              borderColor="#cfe8db"
              chipBg="#e8f6ee"
              chipColor="#1f7a45"
            />
          </Grid>

          <Grid item xs={12} md={6} xl={3}>
            <DashboardPanel
              title="Afwezig"
              count={absentNow.length}
              items={absentNow}
              borderColor="#ead7d7"
              chipBg="#fbebeb"
              chipColor="#a33a3a"
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
            />
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}