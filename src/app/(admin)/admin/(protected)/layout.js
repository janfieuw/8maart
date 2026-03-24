import { Box, Container } from "@mui/material";
import { getAdminSession } from "../_lib/adminAuth.js";
import AdminShell from "../../../../components/admin/admin-shell";

export default async function AdminProtectedLayout({ children }) {
  const session = await getAdminSession();

  return (
    <AdminShell session={session}>
      <Box sx={{ py: 3 }}>
        <Container maxWidth="xl">{children}</Container>
      </Box>
    </AdminShell>
  );
}