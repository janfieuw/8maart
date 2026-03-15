import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
  Chip
} from "@mui/material";
import QrCode2Icon from "@mui/icons-material/QrCode2";

export default async function ScanTagPage() {

  const session = await getSession();

  if (!session?.companyId) {
    redirect("/login");
  }

  const companyId = session.companyId;

  const company = await prisma.company.findUnique({
    where: { id: companyId }
  });

  const tags = await prisma.scanTag.findMany({
    where: { companyId },
    orderBy: { direction: "asc" }
  });

  const inTag = tags.find(t => t.direction === "IN");
  const outTag = tags.find(t => t.direction === "OUT");

  function qrUrl(secret) {
    return `${process.env.NEXT_PUBLIC_BASE_URL}/s/${secret}`;
  }

  function qrImage(secret) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${qrUrl(secret)}`;
  }

  return (
    <Box sx={{ px: 2, py: 2 }}>

      <Stack spacing={3}>

        <Typography
          sx={{
            fontSize: "2.4rem",
            fontWeight: 800,
            color: "#111827"
          }}
        >
          Scan Tag
        </Typography>

        <Typography sx={{ color: "#6b7280" }}>
          Hier kan je de QR-codes van je bedrijf bekijken en downloaden.
        </Typography>


        <Card
          sx={{
            borderRadius: "16px",
            border: "1px solid #e5e7eb"
          }}
        >
          <CardContent
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <Box>
              <Typography sx={{ color: "#6b7280", fontSize: "0.9rem" }}>
                Bedrijf
              </Typography>

              <Typography sx={{ fontWeight: 700, fontSize: "1.2rem" }}>
                {company?.name}
              </Typography>
            </Box>

            <Button
              variant="contained"
              color="success"
              startIcon={<QrCode2Icon />}
            >
              DOWNLOAD SCAN TAG
            </Button>
          </CardContent>
        </Card>


        <Grid container spacing={3}>

          {/* QR IN */}

          <Grid item xs={12} md={6}>
            <Card
              sx={{
                borderRadius: "16px",
                border: "1px solid #e5e7eb"
              }}
            >
              <CardContent>

                <Stack spacing={2}>

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography sx={{ fontWeight: 700 }}>
                      QR IN
                    </Typography>

                    <Chip
                      label="IN"
                      color="success"
                      variant="outlined"
                      size="small"
                    />
                  </Stack>

                  {inTag && (
                    <Stack spacing={2} alignItems="center">

                      <img
                        src={qrImage(inTag.secret)}
                        width={220}
                        height={220}
                        alt="QR IN"
                      />

                      <Button
                        variant="contained"
                        color="success"
                        href={qrImage(inTag.secret)}
                        download
                      >
                        DOWNLOAD QR
                      </Button>

                    </Stack>
                  )}

                </Stack>

              </CardContent>
            </Card>
          </Grid>



          {/* QR OUT */}

          <Grid item xs={12} md={6}>
            <Card
              sx={{
                borderRadius: "16px",
                border: "1px solid #e5e7eb"
              }}
            >
              <CardContent>

                <Stack spacing={2}>

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography sx={{ fontWeight: 700 }}>
                      QR OUT
                    </Typography>

                    <Chip
                      label="OUT"
                      color="warning"
                      variant="outlined"
                      size="small"
                    />
                  </Stack>

                  {outTag && (
                    <Stack spacing={2} alignItems="center">

                      <img
                        src={qrImage(outTag.secret)}
                        width={220}
                        height={220}
                        alt="QR OUT"
                      />

                      <Button
                        variant="contained"
                        color="success"
                        href={qrImage(outTag.secret)}
                        download
                      >
                        DOWNLOAD QR
                      </Button>

                    </Stack>
                  )}

                </Stack>

              </CardContent>
            </Card>
          </Grid>


        </Grid>

      </Stack>

    </Box>
  );
}