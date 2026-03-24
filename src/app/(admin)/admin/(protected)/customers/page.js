import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "../../_lib/adminAuth.js";

function formatDate(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("nl-BE", {
    dateStyle: "short",
  }).format(new Date(value));
}

function statusColor(status) {
  if (status === "ACTIVE") {
    return {
      bg: "#edf7f1",
      color: "#1f6b3b",
    };
  }

  if (status === "TRIAL") {
    return {
      bg: "#f7f0df",
      color: "#8a6a12",
    };
  }

  return {
    bg: "#f9ecec",
    color: "#9b2c2c",
  };
}

function getGemeente(company) {
  return (
    company.gemeente ||
    company.municipality ||
    company.billingCity ||
    company.shippingCity ||
    "-"
  );
}

function getPostcode(company) {
  return (
    company.postcode ||
    company.postalCode ||
    company.billingPostalCode ||
    company.shippingPostalCode ||
    "-"
  );
}

function getLocation(company) {
  const postcode = getPostcode(company);
  const gemeente = getGemeente(company);

  if (postcode === "-" && gemeente === "-") {
    return "-";
  }

  if (postcode === "-") {
    return gemeente;
  }

  if (gemeente === "-") {
    return postcode;
  }

  return `${postcode} ${gemeente}`;
}

function getActiveStart(company) {
  return company.subscriptionStartedAt || null;
}

export default async function AdminCustomersPage() {
  const session = await getAdminSession();

  if (!session?.email) {
    redirect("/admin/login");
  }

  const rows = await prisma.company.findMany({
    orderBy: [{ createdAt: "desc" }],
    include: {
      _count: {
        select: {
          employees: true,
          users: true,
        },
      },
    },
  });

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" fontWeight={800} color="#111827" sx={{ mb: 1 }}>
          Klanten
        </Typography>
        <Typography color="text.secondary">
          Overzicht van alle klanten. Klik op een naam om de volledige klantenfiche te openen.
        </Typography>
      </Box>

      <Card
        sx={{
          borderRadius: "28px",
          border: "1px solid #dde3e8",
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
        }}
      >
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table sx={{ minWidth: 980 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Naam</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Postcode + gemeente</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Start account</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Start active</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">
                    Detail
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography color="text.secondary">
                        Geen klanten gevonden.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => {
                    const colors = statusColor(row.subscriptionStatus);
                    const location = getLocation(row);
                    const activeStart = getActiveStart(row);

                    return (
                      <TableRow
                        key={row.id}
                        hover
                        sx={{
                          "&:last-child td": { borderBottom: 0 },
                        }}
                      >
                        <TableCell>
                          <Button
                            component={Link}
                            href={`/admin/customers/${row.id}`}
                            variant="text"
                            sx={{
                              p: 0,
                              minWidth: 0,
                              textTransform: "none",
                              fontWeight: 800,
                              fontSize: "1rem",
                              color: "#111827",
                              justifyContent: "flex-start",
                              "&:hover": {
                                backgroundColor: "transparent",
                                color: "#39935c",
                              },
                            }}
                          >
                            {row.name || "-"}
                          </Button>
                        </TableCell>

                        <TableCell>{location}</TableCell>

                        <TableCell>
                          <Chip
                            label={row.subscriptionStatus || "-"}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              backgroundColor: colors.bg,
                              color: colors.color,
                            }}
                          />
                        </TableCell>

                        <TableCell>{formatDate(row.createdAt)}</TableCell>
                        <TableCell>{formatDate(activeStart)}</TableCell>

                        <TableCell align="right">
                          <Button
                            component={Link}
                            href={`/admin/customers/${row.id}`}
                            variant="text"
                            endIcon={<ArrowForwardIosRoundedIcon sx={{ fontSize: 14 }} />}
                            sx={{
                              textTransform: "none",
                              fontWeight: 700,
                              color: "#39935c",
                            }}
                          >
                            Open
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Stack>
  );
}