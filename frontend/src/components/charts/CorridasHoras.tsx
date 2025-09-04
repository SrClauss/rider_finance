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
          <Tooltip formatter={(value: any, name: string, props: any) => {
            if (name === 'r_por_hora') return [formatCurrency(value), 'R$/hora'];
            return [value, name];
          }} />
          <Legend />
          <Bar yAxisId="left" dataKey="corridas" fill="#1976d2" />
          <Area yAxisId="right" dataKey="horas" fill="#90caf9" stroke="#42a5f5" />
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  );
}
