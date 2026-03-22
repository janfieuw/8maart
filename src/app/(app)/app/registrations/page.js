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
  if (!date) return "-";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return "-";
  }

  return d.toLocaleString("nl-BE", {
    timeZone: "Europe/Brussels",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default async function RegistrationsPage({ searchParams }) {
  const session = await getSession();

  if (!session?.companyId) {
    redirect("/login");
  }

  const companyId = session.companyId;
  const search = searchParams?.q || "";

  const scans = await prisma.scanEvent.findMany({
    where: { companyId },
    include: { employee: true },
    orderBy: { scannedAt: "desc" },
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
        <Typography sx={{ fontSize: "2.4rem", fontWeight: 800 }}>
          Registraties
        </Typography>

        <Card>
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
                      <TableCell>{formatDate(row.scannedAt)}</TableCell>
                      <TableCell>{row.employee?.name || "-"}</TableCell>
                      <TableCell>{row.employee?.pairCode || "-"}</TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={row.type}
                          sx={{
                            bgcolor:
                              row.type === "IN"
                                ? "success.main"
                                : "#0c4e5f",
                            color: "#fff",
                            fontWeight: 700,
                          }}
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