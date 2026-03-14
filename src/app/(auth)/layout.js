import Image from "next/image";
import { Box, Container, Stack, Typography } from "@mui/material";

export default function AuthLayout({ children }) {
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        bgcolor: "#f3f4f6",
        display: "flex",
        alignItems: "center",
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            minHeight: { xs: "auto", md: 680 },
            borderRadius: 6,
            overflow: "hidden",
            backgroundColor: "#ffffff",
            boxShadow: "0 20px 50px rgba(0,0,0,0.10)",
          }}
        >
          <Box
            sx={{
              position: "relative",
              bgcolor: "#dff3f0",
              p: { xs: 4, md: 5 },
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: { xs: 340, md: "100%" },
            }}
          >
            <Stack spacing={3} sx={{ position: "relative", zIndex: 2 }}>
              <Box sx={{ maxWidth: 320 }}>
                <Image
                  src="/templates/logomypunctoo.png"
                  alt="MyPunctoo"
                  width={320}
                  height={64}
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
                  fontSize: { xs: "1.5rem", md: "2rem" },
                  fontWeight: 800,
                  lineHeight: 1.2,
                  color: "#0f172a",
                  maxWidth: 420,
                }}
              >
                Eenvoudig aanmelden en meteen starten met MyPunctoo
              </Typography>
            </Stack>

            <Box
              sx={{
                mt: 4,
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-end",
                position: "relative",
                zIndex: 2,
              }}
            >
              <Image
                src="/templates/hero.png"
                alt="MyPunctoo hero"
                width={760}
                height={760}
                priority
                style={{
                  width: "100%",
                  height: "auto",
                  maxWidth: "520px",
                  borderRadius: "24px",
                  display: "block",
                }}
              />
            </Box>
          </Box>

          <Box
            sx={{
              p: { xs: 4, md: 6 },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "#ffffff",
            }}
          >
            <Box sx={{ width: "100%", maxWidth: 430 }}>{children}</Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}