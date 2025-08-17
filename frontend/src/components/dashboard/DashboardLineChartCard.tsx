
import { Box, Typography, Divider } from "@mui/material";
import { LineChart } from '@mui/x-charts/LineChart';
import { TREND_METHOD_LABELS, TrendMethod } from '@/interfaces/TrendMethod';

interface DashboardLineChartCardProps {
  label: string;
  series: number[];
  color?: string;
  trendMethod?: TrendMethod;
  labels?: string[];
  projecao?: number | null;
}

function getTrendPercent(series: number[]): { text: string; color: string; value: number } | null {
  if (!series || series.length < 2) return null;
  const first = series[0];
  const last = series[series.length - 1];
  if (first === 0) return null;
  const percent = ((last - first) / first) * 100;
  const rounded = Math.abs(percent) < 0.1 ? 0 : percent;
  const sign = rounded > 0 ? "+" : "";
  const color = rounded >= 0 ? "#00e676" : "#ff1744";
  return {
    text: `${sign}${rounded.toFixed(1)}%`,
    color,
    value: rounded
  };
}

export default function DashboardLineChartCard({ label, series, color = '#1976d2', trendMethod, labels, projecao }: DashboardLineChartCardProps) {
  const trend = getTrendPercent(series);
  // Se labels não for passado, usa 1..N
  const xLabels = labels && labels.length === series.length ? labels : series.map((_, i) => `${i + 1}`);
  // Projeção: desenha uma linha horizontal se fornecido
  const chartSeries = [
    { data: series, color, label: 'Valor' },
    ...(projecao != null ? [{
      data: Array(series.length).fill(projecao),
      color: '#888',
      label: 'Projeção',
      showMark: false,
      area: false,
      style: { strokeDasharray: '6 4' }
    }] : [])
  ];

  // Ajuste dinâmico do eixo Y baseado no valor mínimo e máximo reais da série
  let yMin = 0;
  let yMax = 100;
  if (series && series.length > 0) {
    yMin = Math.min(...series);
    yMax = Math.max(...series);
    if (yMin === yMax) {
      // Se todos os valores são iguais, expande um pouco o range
      yMin = yMin - 1;
      yMax = yMax + 1;
    }
  }

  return (
    <Box sx={{
      background: '#181a20',
      borderRadius: 2,
      boxShadow: 2,
      p: 2,
      mb: 3,
      maxWidth:"70%",
      width: '100%',
      mx: { xs: 2, md: 'auto' }
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6" sx={{ color: color, fontWeight: 700 }}>{label}</Typography>
        {trend && (
          <Typography variant="h6" sx={{ color: trend.color, fontWeight: 900 }}>
            {trend.text}
          </Typography>
        )}
      </Box>
      <LineChart
        height={220}
        series={chartSeries}
        xAxis={[{ scaleType: 'point', data: xLabels }]}
        yAxis={[{ min: yMin, max: yMax }]}
        grid={{ vertical: true, horizontal: true }}
      />
      <Divider sx={{ my: 1, opacity: 0.3 }} />
      <Typography variant="body2" sx={{ color: '#fff', fontSize: 13 }}>
        Tendência: {trend ? (trend.value > 0 ? 'Aumento' : trend.value < 0 ? 'Redução' : 'Estável') : '-'}
      </Typography>
      <Typography variant="caption" sx={{ color: '#aaa', fontSize: 12, mt: 0.5 }}>
        Método de tendência: {TREND_METHOD_LABELS[trendMethod as TrendMethod] ?? 'Variação percentual entre o primeiro e último valor da série'}
      </Typography>
    </Box>
  );
}
