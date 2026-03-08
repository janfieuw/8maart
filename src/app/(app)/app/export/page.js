import { Card, CardContent, Typography } from "@mui/material";

export default function ExportPage() {
  return (
    <Card>
      <CardContent>
        <Typography variant="h5" fontWeight={700}>
          Export
        </Typography>
        <Typography color="text.secondary">CSV export per periode (placeholder)</Typography>
      </CardContent>
    </Card>
  );
}