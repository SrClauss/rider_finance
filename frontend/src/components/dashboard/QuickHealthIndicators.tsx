import React from "react";
import { Box, Card, CardContent, Typography, Stack } from "@mui/material";
import Image from 'next/image';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PaidIcon from '@mui/icons-material/Paid';
import { DashboardResponse } from "@/interfaces/DashboardResponse";
import { useUsuarioContext } from "@/context/UsuarioContext";
import { useTheme } from '@mui/material/styles';
import { formatarMoeda } from '@/utils/currencyUtils';

interface Props {
  data: DashboardResponse;
}

// nomes fixos conforme seed
const UBER_NAME = "Corrida Uber";
const N99_NAME = "Corrida 99";

export default function QuickHealthIndicators({ data }: Props) {
  const { categorias } = useUsuarioContext();
  const theme = useTheme();

  // Usar dados de data.platforms em vez de fetch
  const platforms = data?.platforms || {};
  const uberData = platforms[UBER_NAME];
  const n99Data = platforms[N99_NAME];

  const ganhosUber = uberData?.ganhos ?? null;
  const corridasUber = uberData?.corridas ?? null;
  const iconeUber = uberData?.icone ?? null;
  const corUber = uberData?.cor ?? null;

  const ganhos99 = n99Data?.ganhos ?? null;
  const corridas99 = n99Data?.corridas ?? null;
  const icone99 = n99Data?.icone ?? null;
  const cor99 = n99Data?.cor ?? null;

  // fallback usando DashboardResponse
  const ganhosHoje = data.ganhos_hoje ?? 0;
  const horasHoje = data.horas_hoje || 0;
  const corridasHoje = data.corridas_hoje || 0;
  const ganhosPorHora = horasHoje > 0 ? ganhosHoje / horasHoje : null;
  const ganhoMedioPorCorrida = corridasHoje > 0 ? ganhosHoje / corridasHoje : null;

  // quilometragem
  const kmHoje = data.km_hoje ?? null;
  const kmSemana = data.km_semana ?? null;
  const kmMes = data.km_mes ?? null;

  // ganho por km: usar ganhos / km quando disponível (checando zero)
  const ganhoPorKmHoje = (ganhosHoje > 0 && kmHoje && kmHoje > 0) ? (ganhosHoje / kmHoje) : null;
  const ganhoPorKmSemana = (data.ganhos_semana > 0 && kmSemana && kmSemana > 0) ? (data.ganhos_semana / kmSemana) : null;
  const ganhoPorKmMes = (data.ganhos_mes > 0 && kmMes && kmMes > 0) ? (data.ganhos_mes / kmMes) : null;

  const renderIcon = (backendIcon: string | null, backendColor: string | null, fallbackName: string, fallbackMUI: React.ReactNode) => {
    const iconName = backendIcon || categorias.find(c => c.nome === fallbackName)?.icone || '';
    // Detecta classes customizadas do projeto (icon-uber, icon-99) e as usa diretamente
    if (iconName && iconName.startsWith('icon-')) {
      return <span className={iconName} style={{ width: 28, height: 28, display: 'inline-block' }} aria-hidden />;
    }

    const isImage = /\.(png|jpe?g|svg)$|^https?:\/\//i.test(iconName);
    const iconColor = backendColor || theme.palette.text.primary;
    if (iconName) {
      if (isImage) return <Image src={String(iconName)} alt={fallbackName} width={28} height={28} style={{ objectFit: 'contain' }} unoptimized />;
      // classes de FontAwesome ou similares
      return <i className={iconName} style={{ color: iconColor, fontSize: 28, lineHeight: 1 }} aria-hidden />;
    }
    return fallbackMUI;
  };

  return (
    <Box sx={{ my: 1 }}>
  <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ justifyContent: 'flex-start' }}>
        {/* Uber */}
        <Card sx={{ flex: '1 1 calc(50% - 8px)', maxWidth: 'calc(50% - 8px)', minWidth: 140, mb: 1, bgcolor: 'background.paper', height: 92 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1, height: '100%' }}>
            {renderIcon(iconeUber, corUber, UBER_NAME, <DirectionsCarIcon fontSize="small" />)}
            <Box>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{UBER_NAME}</Typography>
              <Typography sx={{ fontSize: '1rem', color: 'success.main', fontWeight: 700 }}>{ganhosUber !== null ? formatarMoeda(ganhosUber) : '—'}</Typography>
              <Typography variant="caption" color="text.secondary">{corridasUber !== null ? `${corridasUber} corridas` : '—'}</Typography>
            </Box>
          </CardContent>
        </Card>

        {/* 99 */}
        <Card sx={{ flex: '1 1 calc(50% - 8px)', maxWidth: 'calc(50% - 8px)', minWidth: 140, mb: 1, bgcolor: 'background.paper', height: 92 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1, height: '100%' }}>
            {renderIcon(icone99, cor99, N99_NAME, <LocalTaxiIcon fontSize="small" />)}
            <Box>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{N99_NAME}</Typography>
              <Typography sx={{ fontSize: '1rem', color: 'success.main', fontWeight: 700 }}>{ganhos99 !== null ? formatarMoeda(ganhos99) : '—'}</Typography>
              <Typography variant="caption" color="text.secondary">{corridas99 !== null ? `${corridas99} corridas` : '—'}</Typography>
            </Box>
          </CardContent>
        </Card>
      </Stack>

      {/* resumo: ganhos/hora e ganho medio */}
      <Stack direction="row" spacing={2} mt={0.5} flexWrap="wrap" sx={{ justifyContent: 'flex-start' }}>
        <Card sx={{ flex: '1 1 calc(50% - 8px)', maxWidth: 'calc(50% - 8px)', minWidth: 140, bgcolor: 'background.paper', height: 92 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1, height: '100%' }}>
            {renderIcon(null, null, 'ganhos_hora', <AccessTimeIcon fontSize="small" />)}
            <Box>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>Ganhos / Hora</Typography>
              <Typography sx={{ fontSize: '0.95rem', color: 'success.main', fontWeight: 700 }}>{ganhosPorHora !== null ? formatarMoeda(Math.round(ganhosPorHora)) : '—'}</Typography>
              <Typography variant="caption" color="text.secondary">{horasHoje} horas hoje</Typography>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: '1 1 calc(50% - 8px)', maxWidth: 'calc(50% - 8px)', minWidth: 140, bgcolor: 'background.paper', height: 92 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1, height: '100%' }}>
            {renderIcon(null, null, 'ganho_medio_corrida', <PaidIcon fontSize="small" />)}
            <Box>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>Ganho / Corrida</Typography>
              <Typography sx={{ fontSize: '0.95rem', color: 'success.main', fontWeight: 700 }}>{ganhoMedioPorCorrida !== null ? formatarMoeda(Math.round(ganhoMedioPorCorrida)) : '—'}</Typography>
              <Typography variant="caption" color="text.secondary">{corridasHoje} corridas hoje</Typography>
            </Box>
          </CardContent>
        </Card>
        
        {/* Ganho / KM */}
        <Card sx={{ flex: '1 1 calc(50% - 8px)', maxWidth: 'calc(50% - 8px)', minWidth: 140, bgcolor: 'background.paper', height: 92 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1, height: '100%' }}>
            {renderIcon(null, null, 'ganho_por_km', <PaidIcon fontSize="small" />)}
            <Box>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>Ganho / KM</Typography>
              <Typography sx={{ fontSize: '0.95rem', color: 'success.main', fontWeight: 700 }}>{ganhoPorKmHoje !== null ? formatarMoeda(Number(ganhoPorKmHoje.toFixed(2))) : '—'}</Typography>
              <Typography variant="caption" color="text.secondary">Sem: {ganhoPorKmSemana !== null ? formatarMoeda(Number(ganhoPorKmSemana.toFixed(2))) : '—'} • Mês: {ganhoPorKmMes !== null ? formatarMoeda(Number(ganhoPorKmMes.toFixed(2))) : '—'}</Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Quilometragem total */}
        <Card sx={{ flex: '1 1 calc(50% - 8px)', maxWidth: 'calc(50% - 8px)', minWidth: 140, bgcolor: 'background.paper', height: 92 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1, height: '100%' }}>
            {renderIcon(null, null, 'quilometragem_total', <DirectionsCarIcon fontSize="small" />)}
            <Box>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>Quilometragem (km)</Typography>
              <Typography sx={{ fontSize: '0.95rem', color: 'success.main', fontWeight: 700 }}>{kmHoje !== null ? Number(kmHoje).toFixed(2) : '—'}</Typography>
              <Typography variant="caption" color="text.secondary">Sem: {kmSemana !== null ? Number(kmSemana).toFixed(2) : '—'} • Mês: {kmMes !== null ? Number(kmMes).toFixed(2) : '—'}</Typography>
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
