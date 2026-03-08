"use client";

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
          <Stack spacing={2} textAlign="center">
            <Typography variant="h2" fontWeight={900}>
              Punctoo
            </Typography>

            <Typography
              variant="h5"
              color="text.secondary"
              sx={{ maxWidth: 900, mx: "auto" }}
            >
              Slimme aanwezigheidsregistratie met QR-scans, werknemersplanning,
              ScanTags en toestel-koppeling voor snelle check-ins.
            </Typography>
          </Stack>

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

          <Card sx={{ borderRadius: 4 }}>
            <CardContent sx={{ p: 4 }}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={4}
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h6" fontWeight={800} gutterBottom>
                    Wat Punctoo doet
                  </Typography>
                  <Typography color="text.secondary">
                    Beheer werknemers, wijs roosters of kalenderdagen toe,
                    genereer ScanTags en registreer aanwezigheid via QR.
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="h6" fontWeight={800} gutterBottom>
                    Gebruik op smartphone
                  </Typography>
                  <Typography color="text.secondary">
                    Werknemers kunnen hun toestel koppelen zodat latere scans
                    automatisch verlopen zonder telkens opnieuw een PairCode in
                    te geven.
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="h6" fontWeight={800} gutterBottom>
                    SaaS klaar
                  </Typography>
                  <Typography color="text.secondary">
                    Elke klant werkt in zijn eigen bedrijfsomgeving met aparte
                    werknemers, scanlocaties en scanhistoriek.
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}