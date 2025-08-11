'use client'

import { Card, Box, Typography, ToggleButtonGroup, ToggleButton } from "@mui/material";
import { BarChart, LineChart } from "@mui/x-charts";
import { useState } from "react";

interface DashboardChartCardProps {
  title: string;
  data: number[];
  labels: string[];
  color?: string;
  trend?: number;
  chartTypes?: ("bar" | "line")[];
}

export default function DashboardChartCard({ title, data, labels, color = "primary", trend, chartTypes = ["bar", "line"] }: DashboardChartCardProps) {
  const [chartType, setChartType] = useState(chartTypes[0]);
  // Verde padrão do projeto (Material UI: success.main ou #43a047)
  const green = color === 'success' ? '#43a047' : '#888';
  return (
    <Card sx={{ p: 2, minWidth: 220, bgcolor: 'background.paper', color: 'text.primary', boxShadow: 0, border: '1px solid #e0e0e0' }}>
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
      <Box sx={{ height: 180 }}>
        {chartType === "bar" ? (
          <BarChart
            height={160}
            series={[{ data, color: green, label: title }]}
            xAxis={[{ data: labels, scaleType: "band" }]}
          />
        ) : (
          <LineChart
            height={160}
            series={[{ data, color: green, label: title }]}
            xAxis={[{ data: labels, scaleType: "point" }]}
          />
        )}
      </Box>
      {typeof trend === "number" && (
        <Typography variant="caption" sx={{ color: green, mt: 1 }}>
          Tendência: {trend >= 0 ? "+" : ""}{trend}%
        </Typography>
      )}
    </Card>
  );
}
