import { Box, Divider, Typography } from "@mui/material";
import { ReactNode } from "react";

function getPercentChange(current: number, previous: number | null): { text: string; color: string } | null {
    if (previous === null || previous === 0) return null;
    const diff = current - previous;
    const percent = (diff / previous) * 100;
    const rounded = Math.abs(percent) < 0.1 ? 0 : percent;
    const sign = rounded > 0 ? "+" : "";
    const color = rounded >= 0 ? "#00e676" : "#ff1744";
    return {
        text: `${sign}${rounded.toFixed(1)}%`,
        color,
    };
}

type CardColor = "verde" | "vermelha" | "amarela" | "azul";


type DashboardCardDataMod = 'default' | 'percent' | 'currency';

interface DashboardCardDataProps {
    label: string;
    value: number;
    color?: CardColor;
    icon?: ReactNode;
    periodoAnterior: number | null;
    mod?: DashboardCardDataMod;
}




export default function DashboardCardData({ label, value, color, icon, periodoAnterior, mod = 'default' }: DashboardCardDataProps) {
    const percentChange = getPercentChange(value, periodoAnterior);
    const colorMap: Record<CardColor, string> = {
        verde: "#388e3c",
        vermelha: "#c62828",
        amarela: "#fbc02d",
        azul: "#1976d2"
    };
    const bgColor = color ? `${colorMap[color]}88` : "#2196f388";
    let displayValue: string;
    if (mod === 'percent') {
        displayValue = `${value.toFixed(0)}%`;
    } else if (mod === 'currency') {
        displayValue = `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    } else {
        displayValue = value.toString();
    }
    const fontSize = displayValue.length > 5 ? 18 : undefined;
    return (
        <Box
            sx={{
                backgroundColor: bgColor,
                borderRadius: 1,
                boxShadow: 2,
                p: 1.5,
                width: { xs: 160, sm: 200, md: 260 },
                minWidth: { xs: 160, sm: 200, md: 260 },
                maxWidth: { xs: 340, sm: 400, md: 260 },
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
  
            <Typography variant={displayValue.length > 8 ? "h5" : "h4"} sx={{ color: "#fff", fontWeight: 900, textAlign: "center", width: "100%", lineHeight: 1.15, fontSize }}>
                {displayValue}
            </Typography>
            <Divider sx={{ width: "100%", my: 0.75, opacity: "0.3" }} />
            <Box sx={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 20 }}>
                <Typography variant="body2" sx={{ color: "#fff", fontWeight: 700, textAlign: "left", fontSize: 11 }}>
                    {`Anterior: ${periodoAnterior !== null ? periodoAnterior : "-"}`}
                </Typography>
                {periodoAnterior !== null && percentChange ? (
                    <Typography variant="body2" sx={{ color: percentChange.color, fontWeight: 700, textAlign: "right", fontSize: 11 }}>
                        {percentChange.text}
                    </Typography>
                ) : (
                    <Typography variant="body2" sx={{ color: "#fff", fontWeight: 700, textAlign: "right", fontSize: 11 }}>
                        -
                    </Typography>
                )}
            </Box>
        </Box>
    );
}