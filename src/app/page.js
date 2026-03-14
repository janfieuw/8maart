"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
} from "@mui/material";

export default function HomePage() {
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        bgcolor: "#f6f6f6",
        py: { xs: 4, md: 5 },
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={{ xs: 3, md: 4 }} alignItems="center">
          <Box
            sx={{
              width: "100%",
              maxWidth: 680,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Image
              src="/templates/logomypunctoo.png"
              alt="MyPunctoo"
              width={680}
              height={136}
              priority
              style={{
                width: "100%",
                height: "auto",
                display: "block",
              }}
            />
          </Box>

          <Typography
            variant="h5"
            color="text.secondary"
            textAlign="center"
            sx={{
              maxWidth: 920,
              mx: "auto",
              fontWeight: 600,
              lineHeight: 1.35,
              fontSize: { xs: "1.35rem", md: "1.85rem" },
            }}
          >
            Zorgeloos compliant met de arbeidswet vanaf 1 januari 2027 dankzij
            eenvoudige en betrouwbare tijdregistratie
          </Typography>

          <Box
            sx={{
              width: "100%",
              maxWidth: 760,
              borderRadius: 4,
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            }}
          >
            <Image
              src="/templates/hero.png"
              alt="QR scan registratie"
              width={1200}
              height={700}
              priority
              style={{
                width: "100%",
                height: "auto",
                display: "block",
              }}
            />
          </Box>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={3}
            sx={{
              width: "100%",
              alignItems: "stretch",
            }}
          >
            <Card
              sx={{
                flex: 1,
                borderRadius: 4,
                boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Stack spacing={2.5}>
                  <Typography variant="h5" fontWeight={800}>
                    Voor nieuwe klanten
                  </Typography>

                  <Typography color="text.secondary">
                    Maak een account aan, registreer je bedrijf en start meteen
                    met werknemers, ScanTags en QR-scans.
                  </Typography>

                  <Button
                    component={Link}
                    href="/register"
                    variant="contained"
                    size="large"
                    sx={{ minHeight: 52 }}
                  >
                    Account aanmaken
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            <Card
              sx={{
                flex: 1,
                borderRadius: 4,
                boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Stack spacing={2.5}>
                  <Typography variant="h5" fontWeight={800}>
                    Voor bestaande klanten
                  </Typography>

                  <Typography color="text.secondary">
                    Log in op je Punctoo-omgeving en beheer werknemers,
                    planning, scans en ScanTags.
                  </Typography>

                  <Button
                    component={Link}
                    href="/login"
                    variant="outlined"
                    size="large"
                    sx={{ minHeight: 52 }}
                  >
                    Inloggen
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}