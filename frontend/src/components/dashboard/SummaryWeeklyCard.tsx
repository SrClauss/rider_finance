import { DirectionsCarRounded, ShowChart, SpeedRounded, WatchLater } from "@mui/icons-material";
import { Box, Card, Divider, Typography } from "@mui/material";
import InfoCard from "./InfoCard";
import { JSX } from "react";
import { getCurrentDateTime, getUserTimezone, formatUtcToLocalDateString } from "@/utils/dateUtils";
import { useUsuarioContext } from "@/context/SessionContext";

export interface SummaryWeeklyCardProps {
  ganhos_semana: number | null;
  gastos_semana: number | null;
  corridas_semana: number | null;
  km_semana: number | null;
  lucro_semana: number | null;
}

export default function SummaryWeeklyCard({
  ganhos_semana,
  gastos_semana,
  corridas_semana,
  km_semana,
  lucro_semana,
}: SummaryWeeklyCardProps): JSX.Element {
  const { configuracoes } = useUsuarioContext();
  const userTimezone = getUserTimezone(configuracoes);
  
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
            <Typography variant="body2">Resumo (Semana)</Typography>
            <Typography variant="caption">
              {formatUtcToLocalDateString(getCurrentDateTime().toISOString(), userTimezone)}
            </Typography>
          </Box>
        </Box>
        {/* Lucro da semana */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="caption">
            {lucro_semana && lucro_semana >= 0 ? "Lucro da Semana" : "Prejuízo da Semana"}
          </Typography>
          <Typography
            variant="h6"
            color={lucro_semana && lucro_semana >= 0 ? "success.main" : "error.main"}
          >
            {(Math.abs(lucro_semana || 0) / 100).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </Typography>
        </Box>
      </Box>
      <Divider sx={{ marginY: 2, bgcolor: "white" }} />

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
          value={ganhos_semana ? (ganhos_semana / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "-"}
          icon={<ShowChart sx={{ color: "success.main", fontWeight: "bold" }} />}
        />
        <InfoCard
          title="Despesas"
          value={gastos_semana ? (gastos_semana / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "-"}
          icon={<ShowChart sx={{ color: "error.main", fontWeight: "bold" }} />}
        />
        <InfoCard
          title="Corridas"
          value={corridas_semana ? corridas_semana : "-"}
          icon={<SpeedRounded sx={{ color: "info.main", fontWeight: "bold" }} />}
        />
        <InfoCard
          title="km"
          value={
            km_semana != null
              ? (km_semana >= 100 ? Math.round(km_semana).toLocaleString("pt-BR") : km_semana.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }))  
              : "-"
          }
          icon={<DirectionsCarRounded sx={{ color: "warning.main", fontWeight: "bold" }} />}
        />
      </Box>
      <Divider sx={{ marginY: 1, bgcolor: "white" }} />

      {/* Placeholder para comparações futuras */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          gap: 2,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >

      </Box>
    </Card>
  );
}
