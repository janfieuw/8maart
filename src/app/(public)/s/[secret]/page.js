import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Box, Card, CardContent, Chip, Container, Stack, Typography } from "@mui/material";
import ScanRunner from "@/components/scan/ScanRunner";

function directionChip(direction) {
  const d = String(direction || "").toUpperCase();
  const color = d === "IN" ? "success" : d === "OUT" ? "warning" : "default";
  return <Chip size="small" label={d || "-"} color={color} variant="outlined" />;
}

export default async function PublicScanPage({ params }) {
  const p = await params;
  const secret = p?.secret;

  if (!secret) notFound();

  const scanTag = await prisma.scanTag.findUnique({
    where: { secret },
    select: {
      id: true,
      secret: true,
      direction: true,
      scanLocation: {
        select: {
          id: true,
          name: true,
          location: true,
        },
      },
    },
  });

  if (!scanTag) notFound();

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Punctoo
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Scan registreren
          </Typography>
        </Box>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={1.5}>
              <Typography variant="h6" fontWeight={700}>
                {scanTag.scanLocation?.name || "Scanlocatie"}
              </Typography>

              <Stack direction="row" spacing={1} alignItems="center">
                {directionChip(scanTag.direction)}
              </Stack>

              <Typography variant="body2" color="text.secondary">
                Locatie: {scanTag.scanLocation?.location || "-"}
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <ScanRunner secret={secret} />

        <Typography variant="caption" color="text.secondary">
          QR-richting: {scanTag.direction}. Je hoeft geen extra keuze te maken.
        </Typography>
      </Stack>
    </Container>
  );
}