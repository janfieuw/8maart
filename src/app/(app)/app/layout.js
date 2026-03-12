import { Box, Container } from "@mui/material";
import { getSession } from "@/lib/auth";
import AppShell from "@/components/app-shell";

export default async function AppLayout({ children }) {
  const session = await getSession();

  return (
    <AppShell session={session}>
      <Box sx={{ py: 3 }}>
        <Container maxWidth="lg">{children}</Container>
      </Box>
    </AppShell>
  );
}