import { DirectionsCarRounded, ShowChart, SpeedRounded, WatchLater } from "@mui/icons-material";
import { Box, Card, Divider, Typography } from "@mui/material";
import InfoCard from "./InfoCard";
import { JSX } from "react";
import { getCurrentDateTime, getUserTimezone, formatUtcToLocalDateString } from "@/utils/dateUtils";
import { useUsuarioContext } from "@/context/SessionContext";

export interface SummaryLast30DaysCardProps {
  ganhos_30dias: number[];
  gastos_30dias: number[];
  corridas_30dias: number[];
  km_30dias: number[];
  ganhos_mes_passado: number | null;
  gastos_mes_passado: number | null;
  corridas_mes_passado: number | null;
  km_mes_passado: number | null;
}

export default function SummaryLast30DaysCard({
  ganhos_30dias,
  gastos_30dias,
  corridas_30dias,
  km_30dias,
  ganhos_mes_passado,
  gastos_mes_passado,
  corridas_mes_passado,
  km_mes_passado,
}: SummaryLast30DaysCardProps): JSX.Element {
  const { configuracoes } = useUsuarioContext();
  const userTimezone = getUserTimezone(configuracoes);
  
  const totalGanhos = ganhos_30dias.reduce((sum, val) => sum + val, 0);
  const totalGastos = gastos_30dias.reduce((sum, val) => sum + val, 0);
  const totalCorridas = corridas_30dias.reduce((sum, val) => sum + val, 0);
  const totalKm = km_30dias.reduce((sum, val) => sum + val, 0);
  const totalLucro = totalGanhos - totalGastos;

  const calculatePercentage = (current: number, previous: number | null) => {
    if (!previous || previous === 0) return 0;
    return (current - previous) / Math.abs(previous) * 100;
  };

  const getColor = (percentage: number) => {
    if (percentage > 0) return "success.main";
    if (percentage < 0) return "error.main";
    return "info.main";
  };

  const formatPercentage = (percentage: number) => {
    const sign = percentage > 0 ? "+" : "";
    return `${sign}${percentage.toFixed(1)}%`;
  };

  const ganhosPercent = calculatePercentage(totalGanhos, ganhos_mes_passado);
  const gastosPercent = calculatePercentage(totalGastos, gastos_mes_passado);
  const corridasPercent = calculatePercentage(totalCorridas, corridas_mes_passado);
  const horasPercent = calculatePercentage(totalKm, km_mes_passado);

  return (
    <Card
      sx={{
        paddingX: 2,
        paddingY: 3,
        borderRadius: 1,
        boxShadow: 1,
        marginTop: 2,
        height: 'fit-content',
        minHeight: 250
      }}
    >
      {/*Header */}
      <Box sx={{ display: "flex", gap: 1, justifyContent: "space-between", minHeight: 70 }}>
        {/* Logo e Título */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "fit-content",
              height: "fit-content",
              padding: 1.9,
              bgcolor: "background.default",
              borderRadius: 1,
              boxShadow: 1,
            }}
          >
            <DirectionsCarRounded sx={{ fontSize: 30 }} />
          </Box>
          <Box
            sx={{
              paddingY: 1,
            }}
          >
            <Typography variant="body2">Resumo (30 dias)</Typography>
            <Typography variant="caption">
              {formatUtcToLocalDateString(getCurrentDateTime().toISOString(), userTimezone)}
            </Typography>
          </Box>
        </Box>
        {/* Lucro dos últimos 30 dias */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="caption">
            {totalLucro >= 0 ? "Lucro (30 Dias)" : "Prejuízo (30 Dias)"}
          </Typography>
          <Typography
            variant="h6"
            color={totalLucro >= 0 ? "success.main" : "error.main"}
          >
            {(Math.abs(totalLucro) / 100).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </Typography>
        </Box>
      </Box>
      <Divider sx={{ marginY: 1, bgcolor: "white" }} />

      {/* info */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          gap: 2,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <InfoCard
          title="Ganhos"
          value={(totalGanhos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          icon={<ShowChart sx={{ color: "success.main", fontWeight: "bold" }} />}
        />
        <InfoCard
          title="Despesas"
          value={(totalGastos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          icon={<ShowChart sx={{ color: "error.main", fontWeight: "bold" }} />}
        />
        <InfoCard
          title="Corridas"
          value={totalCorridas.toString()}
          icon={<SpeedRounded sx={{ color: "info.main", fontWeight: "bold" }} />}
        />
        <InfoCard
          title="km"
          value={
            totalKm >= 100
              ? Math.round(totalKm).toLocaleString("pt-BR")  
              : (totalKm).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })  
          }
          icon={<DirectionsCarRounded sx={{ color: "warning.main", fontWeight: "bold" }} />}
        />
      </Box>
      <Divider sx={{ marginY: 1, bgcolor: "white" }} />

      {/* Comparações com mês passado */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          gap: 2,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="caption" color={getColor(ganhosPercent)}>{formatPercentage(ganhosPercent)}</Typography>
        <Typography variant="caption" color={getColor(gastosPercent)}>{formatPercentage(gastosPercent)}</Typography>
        <Typography variant="caption" color={getColor(corridasPercent)}>{formatPercentage(corridasPercent)}</Typography>
  <Typography variant="caption" color={getColor(horasPercent)}>{formatPercentage(horasPercent)}</Typography>
      </Box>
    </Card>
  );
}
