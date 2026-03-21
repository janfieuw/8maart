"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image"; // ✅ toegevoegd

import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import DownloadIcon from "@mui/icons-material/Download";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";

const navItems = [
  { label: "Dashboard", href: "/app", icon: <DashboardIcon /> },
  { label: "Werknemers", href: "/app/employees", icon: <PeopleIcon /> },
  { label: "Registraties", href: "/app/records", icon: <ReceiptLongIcon /> },
  { label: "ScanTags", href: "/app/tags", icon: <QrCode2Icon /> },
  { label: "Attendance", href: "/app/attendance", icon: <EventAvailableIcon /> },
  { label: "Export", href: "/app/export", icon: <DownloadIcon /> },
];

export default function Sidebar({ drawerWidth, mobileOpen, onClose }) {
  const pathname = usePathname();

  const content = (
    <Box sx={{ width: drawerWidth, display: "flex", flexDirection: "column", height: "100%" }}>
      
      {/* HEADER */}
      <Toolbar sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ width: 28, height: 28, borderRadius: 1, bgcolor: "primary.main" }} />
        <Typography fontWeight={700}>Punctoo</Typography>
      </Toolbar>

      <Divider />

      {/* NAV */}
      <List sx={{ px: 1, py: 1 }}>
        {navItems.map((item) => {
          const selected =
            pathname === item.href || (item.href !== "/app" && pathname?.startsWith(item.href));

          return (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              selected={selected}
              sx={{ borderRadius: 2, mb: 0.5 }}
              onClick={onClose}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>

      {/* ✅ CERTIFICATEN / TRUST BADGES */}
      <Box
        sx={{
          mt: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          px: 2,
        }}
      >
        <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
          ✔ Veilig & Gecertificeerd
        </Typography>

        <Image
          src="/templates/gdpr-logo.png"
          alt="GDPR Compliant"
          width={120}
          height={120}
          style={{ objectFit: "contain" }}
        />

        <Image
          src="/templates/vestatech-audit-logo.png"
          alt="Audited by Vestatech"
          width={120}
          height={120}
          style={{ objectFit: "contain" }}
        />

        <Image
          src="/templates/secured-server.png"
          alt="Secured Server"
          width={120}
          height={120}
          style={{ objectFit: "contain" }}
        />
      </Box>

      {/* FOOTER */}
      <Box sx={{ mt: "auto", p: 2, color: "text.secondary", fontSize: 12 }}>
        v0.1 • MyPunctoo
      </Box>
    </Box>
  );

  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
        }}
      >
        {content}
      </Drawer>

      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            borderRight: "1px solid",
            borderColor: "divider",
            backgroundImage: "none",
          },
        }}
      >
        {content}
      </Drawer>
    </>
  );
}