import { DirectionsCarRounded, ShowChart, SpeedRounded, WatchLater } from "@mui/icons-material";
import { JSX } from "react";
import { Box, Card, Divider, Typography } from "@mui/material";
import InfoCard from "./InfoCard";
import { getCurrentDateTime, getUserTimezone } from "@/utils/dateUtils";
import { useUsuarioContext } from "@/context/SessionContext";

// Definir e exportar a interface para as props
export interface SummaryTodayCardProps {
  ganhos_hoje: number | null;
  gastos_hoje: number | null;
  corridas_hoje: number | null;
  horas_hoje: number | null;
  lucro_hoje: number | null;
  ganhos_ontem: number | null;
  gastos_ontem: number | null;
  corridas_ontem: number | null;
  horas_ontem: number | null;
}

export default function SummaryTodayCard({
  ganhos_hoje,
  gastos_hoje,
  corridas_hoje,
  horas_hoje,
  lucro_hoje,
  ganhos_ontem,
  gastos_ontem,
  corridas_ontem,
  horas_ontem,
}: SummaryTodayCardProps): JSX.Element {
  const { configuracoes } = useUsuarioContext();
  const userTimezone = getUserTimezone(configuracoes);
  
  const calculatePercentage = (current: number | null, previous: number | null) => {
    if (!previous || previous === 0) return 0;
    return ((current || 0) - previous) / Math.abs(previous) * 100;
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

  const ganhosPercent = calculatePercentage(ganhos_hoje, ganhos_ontem);
  const gastosPercent = calculatePercentage(gastos_hoje, gastos_ontem);
  const corridasPercent = calculatePercentage(corridas_hoje, corridas_ontem);
  const horasPercent = calculatePercentage(horas_hoje, horas_ontem);
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
            <Typography variant="body2">Resumo (Hoje)</Typography>
            <Typography variant="caption">
              {getCurrentDateTime(userTimezone).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </Typography>
          </Box>
        </Box>
        {/* Lucro do dia */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="caption">
            {lucro_hoje && lucro_hoje >= 0 ? "Lucro do Dia" : "Prejuízo do Dia"}
          </Typography>
          <Typography
            variant="h6"
            color={lucro_hoje && lucro_hoje >= 0 ? "success.main" : "error.main"}
          >
            {(Math.abs(lucro_hoje || 0) / 100).toLocaleString("pt-BR", {
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
          value={ganhos_hoje ? (ganhos_hoje / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "-"}
          icon={<ShowChart sx={{ color: "success.main", fontWeight: "bold" }} />}
        />
        <InfoCard
          title="Despesas"
          value={gastos_hoje ? (gastos_hoje / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "-"}
          icon={<ShowChart sx={{ color: "error.main", fontWeight: "bold" }} />}
        />
        <InfoCard
          title="Corridas"
          value={corridas_hoje ? corridas_hoje : "-"}
          icon={<SpeedRounded sx={{ color: "info.main", fontWeight: "bold" }} />}
        />
        <InfoCard
          title="Horas"
          value={horas_hoje ? horas_hoje : "-"}
          icon={<WatchLater sx={{ color: "warning.main", fontWeight: "bold" }} />}
        />
      </Box>
      <Divider sx={{ marginY: 1, bgcolor: "white" }} />

      {/* Comparações com ontem */}
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

