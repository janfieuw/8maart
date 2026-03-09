"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import LogoutButton from "@/components/logout-button";

const drawerWidth = 240;

const navItems = [
  { href: "/app/dashboard", label: "Dashboard" },
  { href: "/app/employees", label: "Werknemers" },
  { href: "/app/registrations", label: "Registraties" },
  { href: "/app/tags", label: "ScanTags" },
  { href: "/app/attendance", label: "Attendance" },
  { href: "/app/export", label: "Export" },
];

export default function AppShell({ session, children }) {
  const pathname = usePathname();

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh", bgcolor: "#f6f6f6" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "1px solid #ddd",
            bgcolor: "#fff",
          },
        }}
      >
        <Toolbar>
          <Typography variant="h5" fontWeight={900}>
            Punctoo
          </Typography>
        </Toolbar>

        <Divider />

        <List sx={{ px: 1, py: 2 }}>
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <ListItemButton
                key={item.href}
                component={Link}
                href={item.href}
                selected={active}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  "&.Mui-selected": {
                    bgcolor: "#f7c40022",
                  },
                  "&.Mui-selected:hover": {
                    bgcolor: "#f7c40033",
                  },
                }}
              >
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: active ? 800 : 500,
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>

        <Box sx={{ mt: "auto", p: 2 }}>
          <Divider sx={{ mb: 2 }} />

          <Stack spacing={1}>
            <Typography variant="body2" fontWeight={700}>
              {session?.name || session?.email || "Gebruiker"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {session?.email || ""}
            </Typography>

            <LogoutButton />
          </Stack>
        </Box>
      </Drawer>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <AppBar
          position="sticky"
          elevation={0}
          color="default"
          sx={{
            bgcolor: "#f7c400",
            color: "#111",
            borderBottom: "1px solid #d8d8d8",
          }}
        >
          <Toolbar>
            <Typography variant="h5" fontWeight={900}>
              MyPunctoo
            </Typography>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: 3 }}>{children}</Box>
      </Box>
    </Box>
  );
}