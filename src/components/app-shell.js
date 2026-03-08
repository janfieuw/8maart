"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import LogoutButton from "@/components/logout-button";

function NavButton({ href, children, pathname }) {
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Button
      component={Link}
      href={href}
      color={active ? "primary" : "inherit"}
      variant={active ? "contained" : "text"}
      size="small"
    >
      {children}
    </Button>
  );
}

export default function AppShell({ session, children }) {
  const pathname = usePathname();

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "#f6f6f6" }}>
      <AppBar position="sticky" color="default" elevation={1}>
        <Container maxWidth="lg">
          <Toolbar
            disableGutters
            sx={{
              minHeight: 72,
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <Typography variant="h6" fontWeight={900}>
                Punctoo
              </Typography>

              <NavButton href="/app/employees" pathname={pathname}>
                Werknemers
              </NavButton>

              <NavButton href="/app/tags" pathname={pathname}>
                ScanTags
              </NavButton>
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ textAlign: "right", display: { xs: "none", md: "block" } }}>
                <Typography variant="body2" fontWeight={700}>
                  {session?.name || session?.email || "Gebruiker"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {session?.email || ""}
                </Typography>
              </Box>

              <LogoutButton />
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {children}
    </Box>
  );
}