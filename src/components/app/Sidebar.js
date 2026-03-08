"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import EventAvailableIcon from "@mui/icons-material/EventAvailable"; // ✅ nieuw

const navItems = [
  { label: "Dashboard", href: "/app", icon: <DashboardIcon /> },
  { label: "Werknemers", href: "/app/employees", icon: <PeopleIcon /> },
  { label: "Registraties", href: "/app/records", icon: <ReceiptLongIcon /> },
  { label: "ScanTags", href: "/app/tags", icon: <QrCode2Icon /> },

  // ✅ nieuw: attendance page
  { label: "Attendance", href: "/app/attendance", icon: <EventAvailableIcon /> },

  { label: "Export", href: "/app/export", icon: <DownloadIcon /> },
];

export default function Sidebar({ drawerWidth, mobileOpen, onClose }) {
  const pathname = usePathname();

  const content = (
    <Box sx={{ width: drawerWidth, display: "flex", flexDirection: "column", height: "100%" }}>
      <Toolbar sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ width: 28, height: 28, borderRadius: 1, bgcolor: "primary.main" }} />
        <Typography fontWeight={700}>Punctoo</Typography>
      </Toolbar>

      <Divider />

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