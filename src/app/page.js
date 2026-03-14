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
    <Box sx={{ minHeight: "100dvh", bgcolor: "#f6f6f6" }}>
      <Container maxWidth="lg">
        <Stack
          spacing={6}
          sx={{
            minHeight: "100dvh",
            justifyContent: "center",
            py: 6,
          }}
        >
          {/* LOGO */}
          <Stack spacing={3} alignItems="center" textAlign="center">
            <Box
              sx={{
                width: "100%",
                maxWidth: 800,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Image
                src="/templates/logomypunctoo.png"
                alt="MyPunctoo"
                width={800}
                height={160}
                priority
                style={{
                  width: "100%",
                  height: "auto",
                  maxWidth: "800px",
                }}
              />
            </Box>

            <Typography
              variant="h5"
              color="text.secondary"
              sx={{ maxWidth: 900, mx: "auto", fontWeight: 600 }}
            >
              Zorgeloos compliant met de arbeidswet vanaf 1 januari 2027 dankzij eenvoudige en betrouwbare tijdregistratie
            </Typography>
          </Stack>

          {/* HERO FOTO */}
          <Box
            sx={{
              width: "100%",
              borderRadius: 4,
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            }}
          >
            <Image
              src="/templates/hero.png"
              alt="QR scan registratie"
              width={1200}
              height={600}
              style={{
                width: "100%",
                height: "auto",
                display: "block",
              }}
            />
          </Box>

          {/* KNOPPEN */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={3}
            justifyContent="center"
          >
            <Card sx={{ flex: 1, borderRadius: 4 }}>
              <CardContent sx={{ p: 4 }}>
                <Stack spacing={3}>
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
                  >
                    Account aanmaken
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ flex: 1, borderRadius: 4 }}>
              <CardContent sx={{ p: 4 }}>
                <Stack spacing={3}>
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