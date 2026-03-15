import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

function formatDate(date) {
  const d = new Date(date);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
}

export default async function RegistrationsPage({ searchParams }) {
  const session = await getSession();

  if (!session?.companyId) {
    redirect("/login");
  }

  const companyId = session.companyId;
  const search = searchParams?.q || "";

  const scans = await prisma.scanEvent.findMany({
    where: {
      companyId,
    },
    include: {
      employee: true,
    },
    orderBy: {
      scannedAt: "desc",
    },
    take: 100,
  });

  const filtered = scans.filter((scan) => {
    if (!search) return true;

    const s = search.toLowerCase();

    return (
      scan.employee?.name?.toLowerCase().includes(s) ||
      scan.employee?.pairCode?.toString().includes(s) ||
      scan.type?.toLowerCase().includes(s)
    );
  });

  return (
    <Box sx={{ px: 2, py: 2 }}>
      <Stack spacing={3}>
        <Box>
          <Typography
            sx={{
              fontSize: "2.4rem",
              fontWeight: 800,
              color: "#111827",
              mb: 1,
            }}
          >
            Registraties
          </Typography>
        </Box>

        <Card
          sx={{
            borderRadius: "16px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
          }}
        >
          <CardContent>
            <Stack spacing={3}>
              <TextField
                placeholder="Zoek werknemer, paircode, type..."
                defaultValue={search}
                name="q"
                fullWidth
              />

              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Datum</TableCell>
                    <TableCell>Werknemer</TableCell>
                    <TableCell>PairCode</TableCell>
                    <TableCell>Type</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filtered.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        {formatDate(row.scannedAt)}
                      </TableCell>

                      <TableCell>
                        {row.employee?.name || "-"}
                      </TableCell>

                      <TableCell>
                        {row.employee?.pairCode || "-"}
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={row.type}
                          color={
                            row.type === "IN"
                              ? "success"
                              : "warning"
                          }
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}

                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4}>
                        Geen registraties gevonden
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}