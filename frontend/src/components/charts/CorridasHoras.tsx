"use client";
import React from 'react';
import { DashboardResponse } from '@/interfaces/DashboardResponse';
import { Box, Typography } from '@mui/material';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface Props { data: DashboardResponse }

export default function CorridasHoras({ data }: Props) {
  const labels = data.ultimos_30_dias_labels ?? [];
  const corridas = data.corridas_30dias ?? [];
  const horas = data.horas_30dias ?? [];
  const ganhos = data.ganhos_30dias ?? [];

  if (!labels.length || !(corridas.length || horas.length)) {
    return <Box sx={{ p: 2 }}><Typography color="text.secondary">Dados insuficientes para Corridas/Horas.</Typography></Box>;
  }

  const chartData = labels.map((lab, i) => ({
    name: lab,
    corridas: corridas[i] ?? 0,
    horas: horas[i] ?? 0,
    ganhos: ganhos[i] ?? 0,
    r_por_hora: (horas[i] && horas[i] > 0) ? Math.round(((ganhos[i] ?? 0) / horas[i])) : null,
  }));

  const formatCurrency = (v: number | null) => v === null ? '—' : (v/100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <Box sx={{ width: '100%', height: 300, mb: 2 }}>
  {/* título movido para o container externo (page.tsx) */}
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip formatter={(value: unknown, name: string) => {
            // recharts may pass a number or an array; normalize safely
            let v: number | null = null;
            if (typeof value === 'number') v = value;
            if (Array.isArray(value) && typeof value[0] === 'number') v = value[0] as number;
            if (name === 'r_por_hora') return [formatCurrency(v), 'R$/hora'];
            return [String(value ?? '—'), name];
          }} />
          <Legend />
          <Bar yAxisId="left" dataKey="corridas" fill="#1976d2" />
          <Area yAxisId="right" dataKey="horas" fill="#90caf9" stroke="#42a5f5" />
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  );
}
