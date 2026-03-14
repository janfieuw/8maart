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

const benefits = [
  {
    title: "Snelle QR-check-ins",
    text: "Werknemers registreren eenvoudig via ScanTags en QR-scans, zonder complexe setup.",
  },
  {
    title: "Overzicht per werknemer",
    text: "Beheer werknemers, registraties en tijdsystemen centraal in één duidelijke omgeving.",
  },
  {
    title: "Klaar voor 2027",
    text: "Werk met betrouwbare tijdregistratie en bereid je organisatie zorgeloos voor op compliance.",
  },
];

export default function HomePage() {
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        bgcolor: "#f6f6f6",
        py: { xs: 4, md: 6 },
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={{ xs: 4, md: 6 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1.05fr 0.95fr" },
              gap: { xs: 4, md: 5 },
              alignItems: "center",
            }}
          >
            <Stack spacing={3}>
              <Box
                sx={{
                  width: "100%",
                  maxWidth: 430,
                }}
              >
                <Image
                  src="/templates/logomypunctoo.png"
                  alt="MyPunctoo"
                  width={430}
                  height={86}
                  priority
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                  }}
                />
              </Box>

              <Typography
                sx={{
                  fontWeight: 800,
                  lineHeight: 1.1,
                  fontSize: { xs: "2.2rem", md: "3.3rem" },
                  color: "#111827",
                  maxWidth: 720,
                }}
              >
                Zorgeloos compliant met de arbeidswet vanaf 1 januari 2027
              </Typography>

              <Typography
                sx={{
                  color: "text.secondary",
                  fontSize: { xs: "1.05rem", md: "1.2rem" },
                  lineHeight: 1.6,
                  maxWidth: 650,
                }}
              >
                Eenvoudige en betrouwbare tijdregistratie met QR-scans,
                werknemersbeheer en ScanTags voor snelle check-ins en minder
                administratie.
              </Typography>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <Button
                  component={Link}
                  href="/register"
                  variant="contained"
                  size="large"
                  sx={{
                    minHeight: 54,
                    px: 4,
                    fontWeight: 700,
                  }}
                >
                  Account aanmaken
                </Button>

                <Button
                  component={Link}
                  href="/login"
                  variant="text"
                  size="large"
                  sx={{
                    minHeight: 54,
                    px: 1,
                    fontWeight: 700,
                  }}
                >
                  Bestaande klant? Inloggen
                </Button>
              </Stack>
            </Stack>

            <Box
              sx={{
                width: "100%",
                borderRadius: 5,
                overflow: "hidden",
                boxShadow: "0 14px 36px rgba(0,0,0,0.14)",
                bgcolor: "#ffffff",
              }}
            >
              <Image
                src="/templates/hero.png"
                alt="MyPunctoo tijdregistratie met QR-scan"
                width={1200}
                height={900}
                priority
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                }}
              />
            </Box>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              gap: 3,
            }}
          >
            {benefits.map((benefit) => (
              <Card
                key={benefit.title}
                sx={{
                  borderRadius: 4,
                  boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                  height: "100%",
                }}
              >
                <CardContent sx={{ p: 3.5 }}>
                  <Stack spacing={1.5}>
                    <Typography variant="h6" fontWeight={800}>
                      {benefit.title}
                    </Typography>

                    <Typography color="text.secondary" sx={{ lineHeight: 1.65 }}>
                      {benefit.text}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Card
            sx={{
              borderRadius: 4,
              boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
            }}
          >
            <CardContent
              sx={{
                p: { xs: 3, md: 4 },
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr auto" },
                  gap: 3,
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography variant="h5" fontWeight={800} gutterBottom>
                    Start vandaag met eenvoudige tijdregistratie
                  </Typography>

                  <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    Maak een account aan en beheer werknemers, ScanTags en
                    registraties in één duidelijke omgeving.
                  </Typography>
                </Box>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  alignItems={{ xs: "stretch", sm: "center" }}
                >
                  <Button
                    component={Link}
                    href="/register"
                    variant="contained"
                    size="large"
                    sx={{ minHeight: 52, px: 4, fontWeight: 700 }}
                  >
                    Account aanmaken
                  </Button>

                  <Button
                    component={Link}
                    href="/login"
                    variant="outlined"
                    size="large"
                    sx={{ minHeight: 52, px: 4, fontWeight: 700 }}
                  >
                    Inloggen
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}