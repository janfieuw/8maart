import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "../../../_lib/adminAuth.js";

function formatDate(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("nl-BE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDateShort(value) {
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

function valueOrDash(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "Ja" : "Nee";
  }

  return String(value);
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

function buildGeneralFields(company) {
  return [
    { label: "Naam", value: company.name },
    { label: "Gemeente", value: getGemeente(company) },
    { label: "Postcode", value: getPostcode(company) },
    { label: "Woonplaats", value: getLocation(company) },
    { label: "Status", value: company.subscriptionStatus },
    { label: "Start account", value: formatDateShort(company.createdAt) },
    { label: "Start active", value: formatDateShort(getActiveStart(company)) },
    { label: "Slug", value: company.slug },
    { label: "Contact e-mail", value: company.contactEmail },
    { label: "Abonnement nummer", value: company.subscriptionNumber },
    { label: "Straat", value: company.street || company.addressStreet },
    { label: "Huisnummer", value: company.houseNumber || company.addressNumber },
    { label: "Land", value: company.country },
    { label: "BTW nummer", value: company.vatNumber || company.vat },
    { label: "Ondernemingsnummer", value: company.companyNumber || company.enterpriseNumber },
    { label: "Aangemaakt op", value: formatDate(company.createdAt) },
    { label: "Laatst bijgewerkt", value: formatDate(company.updatedAt) },
  ];
}

export default async function AdminCustomerDetailPage({ params }) {
  const session = await getAdminSession();

  if (!session?.email) {
    redirect("/admin/login");
  }

  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: {
      users: {
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
      employees: {
        select: {
          id: true,
          name: true,
          code: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: {
          users: true,
          employees: true,
        },
      },
    },
  });

  if (!company) {
    notFound();
  }

  const colors = statusColor(company.subscriptionStatus);
  const generalFields = buildGeneralFields(company);

  return (
    <Stack spacing={3}>
      <Box>
        <Button
          component={Link}
          href="/admin/customers"
          startIcon={<ArrowBackRoundedIcon />}
          variant="text"
          sx={{
            textTransform: "none",
            fontWeight: 700,
            color: "#39935c",
            mb: 1,
            px: 0,
            "&:hover": {
              backgroundColor: "transparent",
            },
          }}
        >
          Terug naar klantenlijst
        </Button>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h4" fontWeight={800} color="#111827" sx={{ mb: 1 }}>
              {company.name || "Klantenfiche"}
            </Typography>

            <Typography color="text.secondary">
              Volledige klantenfiche van deze klant.
            </Typography>
          </Box>

          <Chip
            label={company.subscriptionStatus || "-"}
            sx={{
              fontWeight: 800,
              backgroundColor: colors.bg,
              color: colors.color,
            }}
          />
        </Stack>
      </Box>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              height: "100%",
              borderRadius: "28px",
              border: "1px solid #dde3e8",
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <BusinessRoundedIcon sx={{ color: "#39935c" }} />
                  <Typography fontWeight={800}>Kerngegevens</Typography>
                </Stack>

                <Divider />

                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Gemeente
                    </Typography>
                    <Typography fontWeight={700}>{getGemeente(company)}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Postcode
                    </Typography>
                    <Typography fontWeight={700}>{getPostcode(company)}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Woonplaats
                    </Typography>
                    <Typography fontWeight={700}>{getLocation(company)}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Start account
                    </Typography>
                    <Typography fontWeight={700}>{formatDateShort(company.createdAt)}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Start active
                    </Typography>
                    <Typography fontWeight={700}>{formatDateShort(getActiveStart(company))}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Contact e-mail
                    </Typography>
                    <Typography fontWeight={700}>{valueOrDash(company.contactEmail)}</Typography>
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            sx={{
              height: "100%",
              borderRadius: "28px",
              border: "1px solid #dde3e8",
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <BadgeOutlinedIcon sx={{ color: "#39935c" }} />
                  <Typography fontWeight={800}>Account</Typography>
                </Stack>

                <Divider />

                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Slug
                    </Typography>
                    <Typography fontWeight={700}>{valueOrDash(company.slug)}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Abonnement nummer
                    </Typography>
                    <Typography fontWeight={700}>{valueOrDash(company.subscriptionNumber)}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Aangemaakt op
                    </Typography>
                    <Typography fontWeight={700}>{formatDate(company.createdAt)}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Laatst bijgewerkt
                    </Typography>
                    <Typography fontWeight={700}>{formatDate(company.updatedAt)}</Typography>
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            sx={{
              height: "100%",
              borderRadius: "28px",
              border: "1px solid #dde3e8",
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <PeopleAltOutlinedIcon sx={{ color: "#39935c" }} />
                  <Typography fontWeight={800}>Gebruik</Typography>
                </Stack>

                <Divider />

                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Werkgevers
                    </Typography>
                    <Typography fontWeight={700}>{company._count.users}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Werknemers
                    </Typography>
                    <Typography fontWeight={700}>{company._count.employees}</Typography>
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
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
          <Stack spacing={2.5}>
            <Typography variant="h6" fontWeight={800}>
              Volledige klantenfiche
            </Typography>

            <Grid container spacing={2}>
              {generalFields.map((field) => (
                <Grid item xs={12} md={6} key={field.label}>
                  <Box
                    sx={{
                      border: "1px solid #eef2f7",
                      borderRadius: 3,
                      p: 2,
                      height: "100%",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {field.label}
                    </Typography>
                    <Typography fontWeight={700}>{valueOrDash(field.value)}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              borderRadius: "28px",
              border: "1px solid #dde3e8",
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={800}>
                  Werkgevers
                </Typography>

                {company.users.length === 0 ? (
                  <Typography color="text.secondary">Geen werkgevers gevonden.</Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {company.users.map((user) => (
                      <Box
                        key={user.id}
                        sx={{
                          border: "1px solid #eef2f7",
                          borderRadius: 3,
                          p: 2,
                        }}
                      >
                        <Typography fontWeight={700}>{valueOrDash(user.email)}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Toegevoegd op {formatDate(user.createdAt)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{
              borderRadius: "28px",
              border: "1px solid #dde3e8",
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={800}>
                  Werknemers
                </Typography>

                {company.employees.length === 0 ? (
                  <Typography color="text.secondary">Geen werknemers gevonden.</Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {company.employees.map((employee) => (
                      <Box
                        key={employee.id}
                        sx={{
                          border: "1px solid #eef2f7",
                          borderRadius: 3,
                          p: 2,
                        }}
                      >
                        <Typography fontWeight={700}>
                          {valueOrDash(employee.name)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Code: {valueOrDash(employee.code)} · toegevoegd op {formatDate(employee.createdAt)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}