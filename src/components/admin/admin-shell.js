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
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import AdminLogoutButton from "@/components/admin/admin-logout-button";

const drawerWidth = 240;

const navItems = [
  { href: "/admin", label: "Dashboard", icon: <DashboardOutlinedIcon /> },
  {
    href: "/admin/customers",
    label: "Klanten",
    icon: <BusinessOutlinedIcon />,
  },
];

export default function AdminShell({ session, children }) {
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
          <Link href="/admin" style={{ display: "inline-flex" }}>
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

          <Box sx={{ mt: "auto", p: 2, flexShrink: 0 }}>
            <Divider sx={{ mb: 2 }} />

            <Stack spacing={1.5}>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <AdminPanelSettingsOutlinedIcon sx={{ fontSize: 18, color: "#39935c" }} />
                  <Typography variant="body2" fontWeight={700}>
                    Punctoo Admin
                  </Typography>
                </Stack>

                <Typography variant="caption" color="text.secondary">
                  {session?.email || ""}
                </Typography>
              </Box>

              <AdminLogoutButton />
            </Stack>
          </Box>
        </Box>
      </Drawer>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: "#39935c",
            borderBottom: "1px solid #d8d8d8",
          }}
        >
          <Toolbar sx={{ minHeight: "72px !important" }}>
            <Typography variant="h5" fontWeight={800} color="white">
              Punctoo Admin
            </Typography>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: 3 }}>{children}</Box>
      </Box>
    </Box>
  );
}