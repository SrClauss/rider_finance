import { Box, Typography, Divider } from "@mui/material";
import { ReactNode } from "react";

type DashboardSimpleCardMod = 'default' | 'percent' | 'currency';

interface DashboardSimpleCardProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
  color?: string;
  mod?: DashboardSimpleCardMod;
}

export default function DashboardSimpleCard({ label, value, icon, color, mod = 'default' }: DashboardSimpleCardProps) {
  let displayValue: string;
  if (mod === 'percent') {
    displayValue = typeof value === 'number' ? `${value.toFixed(0)}%` : `${value}%`;
  } else if (mod === 'currency') {
    displayValue = typeof value === 'number' ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : `R$ ${value}`;
  } else {
    displayValue = value.toString();
  }
  return (
    <Box
      sx={{
        backgroundColor: color || '#2196f388',
        borderRadius: 1,
        boxShadow: 2,
        p: 1.5,
        width: { xs: 160, sm: 200, md: 260 },
        minWidth: { xs: "80%", sm: "80%", md: 260 },
        maxWidth: { xs: "80%", sm: "80%", md: 260 },
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 0.75,
        border: "none",
        minHeight: 110,
        justifyContent: "center"
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-start", width: "100%", gap: 0.75 }}>
        {icon && (
          <Box sx={{ display: "flex", alignItems: "center", mr: 1 }}>
            {icon}
          </Box>
        )}
        <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 700, textAlign: "left" }}>
          {label}
        </Typography>
      </Box>
      <Divider sx={{ width: "100%", my: 0.5, opacity: 0.3 }} />
      <Typography
        variant={displayValue.length > 8 ? "h5" : "h4"}
        sx={{
          color: "#fff",
          fontWeight: 900,
          textAlign: "center",
          width: "100%",
          lineHeight: 1.15,
          fontSize: displayValue.length > 5 ? 18 : undefined
        }}
      >
        {displayValue}
      </Typography>
    </Box>
  );
}
