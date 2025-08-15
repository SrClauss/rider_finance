
'use client';

import { Box, Typography, ToggleButtonGroup, ToggleButton } from "@mui/material";
import { BarChart, LineChart } from "@mui/x-charts";
import { useState } from "react";
import { TrendMethod, TREND_METHOD_LABELS } from "@/interfaces/TrendMethod";

export type DashboardChartCardProps = {
  title: string;
  data: number[];
  labels: string[];
  color?: string;
  trend?: number;
  chartTypes?: ("bar" | "line")[];
  borderRadius?: number;
  trendMethod?: string;
};

export default function DashboardChartCard({ title, data, labels, color = "primary", trend, chartTypes = ["bar", "line"], borderRadius, trendMethod }: DashboardChartCardProps) {
  const [chartType, setChartType] = useState(chartTypes[0]);
  // Cores com transparência
  const chartColor =
    color === 'success' ? 'rgba(67, 160, 71, 0.6)' : // verde translúcido
    color === 'error' ? 'rgba(229, 57, 53, 0.6)' :   // vermelho translúcido
    color === 'primary' ? 'rgba(33, 150, 243, 0.6)' : // azul translúcido para lucro
    '#888';
  return (
    <Box sx={{ width: '95vw', maxWidth: '100vw', m: 0, bgcolor: 'background.paper', borderRadius: typeof borderRadius === 'number' ? borderRadius : 1.5, border: '1px solid #23272f', boxShadow: 1,  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="body2" sx={{ opacity: 0.7, fontWeight: 500 }}>{title}</Typography>
      <ToggleButtonGroup
        value={chartType}
        exclusive
        onChange={(_, v) => v && setChartType(v)}
        size="small"
        sx={{ mb: 1 }}
      >
        {chartTypes.map((type) => (
          <ToggleButton key={type} value={type} sx={{ color: 'text.secondary', border: 'none', bgcolor: 'background.default' }}>{type === "bar" ? "Barras" : "Linha"}</ToggleButton>
        ))}
      </ToggleButtonGroup>
      <Box sx={{ width: '100%', height: 180 }}>
        {chartType === "bar" ? (
          <BarChart
            height={160}
            series={[{ data, color: chartColor, label: title }]}
            xAxis={[{ data: labels, scaleType: "band" }]}
          />
        ) : (
          <LineChart
            height={160}
            series={[{ data, color: chartColor, label: title }]}
            xAxis={[{ data: labels, scaleType: "point" }]}
          />
        )}
      </Box>
      {typeof trend === "number" && (
        <Typography variant="caption" sx={{ color: chartColor, mt: 1 }}>
          Tendência: {trend >= 0 ? "+" : ""}{trend}%
          {trendMethod && (
            <span style={{ marginLeft: 8, color: '#888' }}>
              ({TREND_METHOD_LABELS[trendMethod as keyof typeof TREND_METHOD_LABELS] ?? trendMethod})
            </span>
          )}
        </Typography>
      )}
    </Box>
  );
}
