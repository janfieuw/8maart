"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import QrCode2OutlinedIcon from "@mui/icons-material/QrCode2Outlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import LogoutButton from "@/components/logout-button";

const drawerWidth = 240;

const navItems = [
  { href: "/app/dashboard", label: "Dashboard", icon: <DashboardOutlinedIcon /> },
  { href: "/app/employees", label: "Werknemers", icon: <GroupOutlinedIcon /> },
  { href: "/app/registrations", label: "Registraties", icon: <FactCheckOutlinedIcon /> },
  { href: "/app/scantag", label: "ScanTag", icon: <QrCode2OutlinedIcon /> },
  { href: "/app/attendance", label: "Aanwezigheid", icon: <AccessTimeOutlinedIcon /> },
  { href: "/app/account", label: "Account", icon: <BusinessOutlinedIcon /> },
  { href: "/app/export", label: "Export", icon: <FileDownloadOutlinedIcon /> },
];

export default function AppShell({ session, children }) {
  const pathname = usePathname();

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh", bgcolor: "#f5f5f5" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "1px solid #ddd",
            bgcolor: "#f8f8f8",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          },
        }}
      >
        <Toolbar
          sx={{
            minHeight: "72px !important",
            display: "flex",
            alignItems: "center",
            px: 2.5,
            flexShrink: 0,
          }}
        >
          <Link href="/app/dashboard" style={{ display: "inline-flex" }}>
            <Image
              src="/templates/logomypunctoo.png"
              alt="MyPunctoo"
              width={180}
              height={52}
              style={{ objectFit: "contain", cursor: "pointer" }}
              priority
            />
          </Link>
        </Toolbar>

        <Divider />

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
          }}
        >
          <List sx={{ px: 1.5, py: 2, flexShrink: 0 }}>
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
                    minHeight: 48,
                    borderRadius: 3,
                    mb: 0.5,
                    px: 1.5,
                    color: "#222",
                    "& .MuiListItemIcon-root": {
                      color: active ? "#222" : "#666",
                      minWidth: 38,
                    },
                    "&.Mui-selected": {
                      bgcolor: "#efe9d8",
                    },
                    "&.Mui-selected:hover": {
                      bgcolor: "#e8e1cc",
                    },
                    "&:hover": {
                      bgcolor: "#f0f0f0",
                    },
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: active ? 800 : 500,
                      fontSize: 16,
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>

          <Box
            sx={{
              px: 3,
              pb: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 1,
              flexShrink: 0,
            }}
          >
            <Box sx={{ width: 68 }}>
              <Image
                src="/templates/gdpr-logo.png"
                alt="GDPR Compliant"
                width={68}
                height={68}
                style={{ width: "80px", height: "auto", objectFit: "contain" }}
              />
            </Box>

            <Box sx={{ width: 68 }}>
              <Image
                src="/templates/vestatech-audit-logo.png"
                alt="Audited by Vestatech"
                width={68}
                height={68}
                style={{ width: "80px", height: "auto", objectFit: "contain" }}
              />
            </Box>

            <Box sx={{ width: 68 }}>
              <Image
                src="/templates/secured-server.png"
                alt="Secured Server"
                width={68}
                height={48}
                style={{ width: "80px", height: "auto", objectFit: "contain" }}
              />
            </Box>
          </Box>

          <Box sx={{ mt: "auto", p: 2, flexShrink: 0 }}>
            <Divider sx={{ mb: 2 }} />

            <Stack spacing={1.5}>
              <Box>
                <Typography variant="body2" fontWeight={700}>
                  {session?.name || session?.email || "Gebruiker"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {session?.email || ""}
                </Typography>
              </Box>

              <LogoutButton />
            </Stack>
          </Box>
        </Box>
      </Drawer>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: "#024659",
            borderBottom: "1px solid #d8d8d8",
          }}
        >
          <Toolbar sx={{ minHeight: "72px !important" }}>
            <Typography variant="h5" fontWeight={800} color="white">
              {session?.companyName || "MyPunctoo"}
            </Typography>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: 3 }}>{children}</Box>
      </Box>
    </Box>
  );
}