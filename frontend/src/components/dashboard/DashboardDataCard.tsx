import { Card, Typography, Box } from "@mui/material";
import { ReactNode } from "react";

interface DashboardDataCardProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
  color?: string;
  trend?: number;
}

export default function DashboardDataCard({ label, value, icon, color = "primary", trend }: DashboardDataCardProps) {
  return (
    <Card sx={{ p: 2, minWidth: 120, bgcolor: 'background.paper', color: 'text.primary', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: 0, border: '1px solid #e0e0e0' }}>
      {icon && <Box sx={{ mb: 1 }}>{icon}</Box>}
      <Typography variant="body2" sx={{ opacity: 0.7, fontWeight: 500 }}>{label}</Typography>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>{value}</Typography>
      {typeof trend === "number" && (
        <Typography variant="caption" sx={{ color: '#888', mt: 1 }}>
          {trend >= 0 ? "+" : ""}{trend}%
        </Typography>
      )}
    </Card>
  );
}
