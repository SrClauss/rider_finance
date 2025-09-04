"use client";
import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { DashboardResponse } from "@/interfaces/DashboardResponse";

interface Props { data: DashboardResponse }

function pathFromValues(values: number[], width = 600, height = 200) {
  if (!values || values.length === 0) return '';
  const max = Math.max(...values);
  const min = Math.min(...values);
  const len = values.length;
  const stepX = width / Math.max(1, len - 1);
  return values.map((v, i) => {
    const x = Math.round(i * stepX);
    const y = Math.round(height - ((v - min) / Math.max(1, max - min)) * height);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
}

const Sparkline = ({ values }: { values: number[] }) => {
  const w = 120, h = 36;
  const path = pathFromValues(values.map(v=>v||0), w, h);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <path d={path} fill="none" stroke="#1976d2" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const MiniLine = ({ values }: { values: number[] }) => {
  const w = 600, h = 220;
  const path = pathFromValues(values.map(v=>v||0), w, h - 20);
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <path d={path} fill="none" stroke="#2e7d32" strokeWidth={2} />
    </svg>
  );
};

const BarsAndLine = ({ bars, line }: { bars: number[]; line: number[] }) => {
  const w = 600, h = 200;
  const len = Math.max(bars.length, line.length);
  if (len === 0) return null;
  const barW = w / Math.max(1, len);
  const max = Math.max(...bars, ...line, 1);
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {bars.map((v, i) => {
        const x = i * barW;
        const bh = Math.round((v / max) * (h - 20));
        return <rect key={i} x={x} y={h - bh} width={barW * 0.8} height={bh} fill="#0288d1" />;
      })}
      <path d={pathFromValues(line.map(v=>v||0), w, h - 20)} fill="none" stroke="#ff9800" strokeWidth={2} />
    </svg>
  );
};

export default function DashboardMainCharts({ data }: Props) {
  const ganhos30 = data.ganhos_30dias || [];
  const gastos30 = data.gastos_30dias || [];
  const lucro30 = data.lucro_30dias || [];
  const corridas30 = data.corridas_30dias || [];
  const horas30 = data.horas_30dias || [];

  return (
    <Box sx={{ mt: 4 }}>
      {/* Conteúdo dos charts foi removido dos títulos para permitir controle externo em page.tsx */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ height: 280 }}>
            <MiniLine values={ganhos30} />
            <MiniLine values={gastos30} />
            <MiniLine values={lucro30} />
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <Card>
          <CardContent>
            <Box sx={{ height: 200 }}>
              <BarsAndLine bars={corridas30.map(v=>v as number||0)} line={horas30.map(v=>v as number||0)} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
              <Box>
                <Typography variant="caption">Ganhos</Typography>
                <Sparkline values={data.ganhos_7dias || []} />
              </Box>
              <Box>
                <Typography variant="caption">Gastos</Typography>
                <Sparkline values={data.gastos_7dias || []} />
              </Box>
              <Box>
                <Typography variant="caption">Lucro</Typography>
                <Sparkline values={data.lucro_7dias || []} />
              </Box>
              <Box>
                <Typography variant="caption">Corridas</Typography>
                <Sparkline values={(data.corridas_7dias || []).map(v=>v as number)} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Box sx={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
            <Typography variant="caption">Implementação opcional: waterfall acumulado do mês</Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
