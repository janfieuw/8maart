"use client";

import { useState } from "react";
import { Box, AppBar, Toolbar, Typography, IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Sidebar from "./Sidebar";

const drawerWidth = 264;

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          borderBottom: "1px solid",
          borderColor: "divider",
          backgroundImage: "none",
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ mr: 2, display: { md: "none" } }}
            aria-label="open navigation"
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6">MyPunctoo</Typography>
        </Toolbar>
      </AppBar>

      <Sidebar
        drawerWidth={drawerWidth}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <Box component="main" sx={{ flexGrow: 1, ml: { md: `${drawerWidth}px` }, p: 3, pt: 10 }}>
        {children}
      </Box>
    </Box>
  );
}