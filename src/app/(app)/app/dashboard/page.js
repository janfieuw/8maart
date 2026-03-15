"use client";

import {
  Box,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

const workingNow = ["POL", "PIET", "JAN", "MIEKE"];
const absentNow = ["KAREL"];

const latestIns = [
  "15/3 - 05:00 - POL",
  "15/3 - 05:10 - PIET",
  "15/3 - 05:45 - JAN",
  "15/3 - 05:51 - MIEKE",
];

const latestOuts = [
  "14/3 - 13:01 - POL",
  "14/3 - 13:10 - PIET",
  "14/3 - 13:51 - MIEKE",
  "14/3 - 13:45 - JAN",
  "14/3 - 13:45 - KAREL",
];

function DashboardBlock({ title, items, minHeight = 220 }) {
  return (
    <Card
      sx={{
        borderRadius: 4,
        border: "2px solid #12384b",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        height: "100%",
      }}
    >
      <CardContent
        sx={{
          p: 2.5,
          minHeight,
        }}
      >
        <Stack spacing={2}>
          <Typography
            sx={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            {title}
          </Typography>

          {items?.length ? (
            <Stack spacing={1}>
              {items.map((item, index) => (
                <Typography
                  key={`${title}-${index}`}
                  sx={{
                    fontSize: "1rem",
                    color: "#111827",
                    lineHeight: 1.4,
                  }}
                >
                  {item}
                </Typography>
              ))}
            </Stack>
          ) : (
            <Typography
              sx={{
                fontSize: "0.95rem",
                color: "#6b7280",
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

export default function DashboardPage() {
  return (
    <Box>
      <Stack spacing={3}>
        <Box>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: "#111827",
              mb: 0.5,
              fontSize: { xs: "2rem", md: "2.5rem" },
            }}
          >
            Dashboard
          </Typography>

          <Typography
            sx={{
              color: "#6b7280",
              fontSize: "1rem",
            }}
          >
            Overzicht van aanwezigheid en laatste scans
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <DashboardBlock title="Aan het werk" items={workingNow} />
          </Grid>

          <Grid item xs={12} md={3}>
            <DashboardBlock title="Afwezig" items={absentNow} />
          </Grid>

          <Grid item xs={12} md={3}>
            <DashboardBlock title="Laatste IN" items={latestIns} />
          </Grid>

          <Grid item xs={12} md={3}>
            <DashboardBlock title="Laatste OUT" items={latestOuts} />
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}