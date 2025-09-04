"use client";
import React from 'react';
import { DashboardResponse } from '@/interfaces/DashboardResponse';
import { Box, Typography } from '@mui/material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface Props { data: DashboardResponse }

export default function Dashboard30Days({ data }: Props) {
  const labels = data.ultimos_30_dias_labels ?? [];
  const ganhos = data.ganhos_30dias ?? [];
  const gastos = data.gastos_30dias ?? [];
  const lucro = data.lucro_30dias ?? [];

  if (!labels.length || !(ganhos.length || gastos.length || lucro.length)) {
    return <Box sx={{ p: 2 }}><Typography color="text.secondary">Dados insuficientes para o gráfico 30 dias.</Typography></Box>;
  }

  const chartData = labels.map((lab, i) => ({
    name: lab,
    ganhos: ganhos[i] ?? 0,
    gastos: gastos[i] ?? 0,
    lucro: lucro[i] ?? ( (ganhos[i] ?? 0) - (gastos[i] ?? 0) ),
  }));

  const formatCurrency = (v: number) => (v/100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <Box sx={{ width: '100%', height: 320, mb: 2 }}>
  {/* título movido para o container externo (page.tsx) */}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(v) => (v/100).toLocaleString('pt-BR')} />
          <Tooltip formatter={(value: number) => formatCurrency(value as number)} />
          <Legend />
          <Line type="monotone" dataKey="ganhos" stroke="#2e7d32" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="gastos" stroke="#c62828" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="lucro" stroke="#1565c0" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
