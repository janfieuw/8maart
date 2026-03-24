"use client";

import { useRouter } from "next/navigation";
import { Button } from "@mui/material";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";

export default function AdminLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", {
      method: "POST",
    });

    router.push("/admin/login");
    router.refresh();
  }

  return (
    <Button
      variant="outlined"
      color="inherit"
      startIcon={<LogoutOutlinedIcon />}
      onClick={handleLogout}
      sx={{
        justifyContent: "flex-start",
        borderColor: "#bbb",
        color: "#222",
        borderRadius: 3,
      }}
      fullWidth
    >
      Logout
    </Button>
  );
}