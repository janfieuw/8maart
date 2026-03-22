import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import DownloadIcon from "@mui/icons-material/Download";
import SmartphoneIcon from "@mui/icons-material/Smartphone";

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://8maart-production.up.railway.app"
  );
}

function scanUrl(secret) {
  return `${getBaseUrl()}/s/${secret}`;
}

function qrImageUrl(secret) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
    scanUrl(secret)
  )}`;
}

export default async function ScanTagPage() {
  const session = await getSession();

  if (!session?.companyId) {
    redirect("/login");
  }

  const companyId = session.companyId;

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
    },
  });

  const tags = await prisma.scanTag.findMany({
    where: { companyId },
    orderBy: { direction: "asc" },
    select: {
      id: true,
      direction: true,
      secret: true,
    },
  });

  const inTag = tags.find((tag) => tag.direction === "IN");
  const outTag = tags.find((tag) => tag.direction === "OUT");

  return (
    <Box sx={{ px: 2, py: 2 }}>
      <Stack spacing={3}>
        <Box>
          <Typography
            sx={{
              fontSize: "2.4rem",
              fontWeight: 800,
              color: "#111827",
              mb: 1,
            }}
          >
            Scan Tag
          </Typography>

          <Typography sx={{ color: "#6b7280" }}>
            Hier kan je de QR-codes van je bedrijf bekijken en downloaden.
          </Typography>
        </Box>

        {/* BEDRIJF */}
        <Card
          sx={{
            borderRadius: "16px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
          }}
        >
          <CardContent
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Box>
              <Typography sx={{ color: "#6b7280", fontSize: "0.9rem" }}>
                Bedrijf
              </Typography>

              <Typography sx={{ fontWeight: 700, fontSize: "1.2rem" }}>
                {company?.name || "-"}
              </Typography>
            </Box>

            {inTag && outTag ? (
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                href="/api/scantag/download"
              >
                DOWNLOAD SCAN TAG
              </Button>
            ) : null}
          </CardContent>
        </Card>

        {/* INFO BLOK */}
        <Box
          sx={{
            backgroundColor: "#e3f2fd",
            borderRadius: "12px",
            p: 3,
            display: "flex",
            gap: 2,
            alignItems: "flex-start",
          }}
        >
          <SmartphoneIcon sx={{ color: "#1976d2", mt: "2px" }} />

          <Box>
            <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
              Toestel koppelen
            </Typography>

            <Typography sx={{ color: "#1f2937" }}>
              Open de camera op je smartphone en scan een QR-code om dit toestel te koppelen.
              <br />
              Je wordt gevraagd om een koppelcode in te voeren. Deze vind je op de pagina "Werknemers".
            </Typography>
          </Box>
        </Box>

        {!inTag || !outTag ? (
          <Card
            sx={{
              borderRadius: "16px",
              border: "1px solid #f5d7a1",
              backgroundColor: "#fff7ed",
            }}
          >
            <CardContent>
              <Typography sx={{ color: "#9a6700", fontWeight: 600 }}>
                Er werden geen QR-codes gevonden voor dit bedrijf.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {/* IN */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: "16px", border: "1px solid #e5e7eb" }}>
                <CardContent>
                  <Stack spacing={2} alignItems="center">
                    <Stack direction="row" justifyContent="space-between" sx={{ width: "100%" }}>
                      <Typography sx={{ fontWeight: 700, fontSize: "1.4rem" }}>
                        QR IN
                      </Typography>

                      <Chip
                        label="IN"
                        size="small"
                        sx={{
                          bgcolor: "success.main",
                          color: "#fff",
                          fontWeight: 700,
                        }}
                      />
                    </Stack>

                    <img src={qrImageUrl(inTag.secret)} width={240} />

                    <Button
                      variant="contained"
                      startIcon={<QrCode2Icon />}
                      href={qrImageUrl(inTag.secret)}
                      download
                    >
                      DOWNLOAD QR
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* OUT */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: "16px", border: "1px solid #e5e7eb" }}>
                <CardContent>
                  <Stack spacing={2} alignItems="center">
                    <Stack direction="row" justifyContent="space-between" sx={{ width: "100%" }}>
                      <Typography sx={{ fontWeight: 700, fontSize: "1.4rem" }}>
                        QR OUT
                      </Typography>

                      <Chip
                        label="OUT"
                        size="small"
                        sx={{
                          bgcolor: "#0c4e5f",
                          color: "#fff",
                          fontWeight: 700,
                        }}
                      />
                    </Stack>

                    <img src={qrImageUrl(outTag.secret)} width={240} />

                    <Button
                      variant="contained"
                      startIcon={<QrCode2Icon />}
                      href={qrImageUrl(outTag.secret)}
                      download
                    >
                      DOWNLOAD QR
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Stack>
    </Box>
  );
}