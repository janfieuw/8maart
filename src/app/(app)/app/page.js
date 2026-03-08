import { Card, CardContent, Typography } from "@mui/material";

export default function DashboardPage() {
  return (
    <Card>
      <CardContent>
        <Typography variant="h5" fontWeight={700}>
          Dashboard
        </Typography>
        <Typography color="text.secondary">
          Overzicht: wie is aanwezig + aandachtspunten (placeholder)
        </Typography>
      </CardContent>
    </Card>
  );
}