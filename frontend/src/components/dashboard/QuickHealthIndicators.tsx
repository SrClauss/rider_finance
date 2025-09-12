
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
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import SectionTitle from "../ui/SectionTitle";

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
  // helper: soma arrays e retorna 0 se vazio
  const sum = (arr?: number[]) => (arr && arr.length ? arr.reduce((s, v) => s + v, 0) : 0);

  // card sizing shared para largura igual e responsiva via grid
  // Items usam largura 100% e o container grid controla colunas/spacing
  const cardSxBase = { width: '75%' , mb: 1, bgcolor: 'background.paper', height: 72 } as const;
  const cardSxColumn = { ...cardSxBase, display: 'flex', flexDirection: 'column', p: 2, gap: 1 } as const;

  // grid container usado para todas as linhas de cards: 2 colunas responsivas
  const gridContainerSx = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(160px, 1fr))',
    p:1,
    alignItems: 'start',
    justifyContent: 'center',
    width: '100%',
  } as const;

  const calcMetrics = (period: 'today' | '7d' | '30d') => {
    if (period === 'today') {
      const ganhos = data.ganhos_hoje ?? 0;
      const corridas = data.corridas_hoje ?? 0;
      const horas = data.horas_hoje ?? 0;
      const km = data.km_hoje ?? 0;
      return {
        ganhos,
        corridas,
        horas,
        km,
        eficiencia: horas > 0 ? ganhos / horas : null,
        ticketMedio: corridas > 0 ? ganhos / corridas : null,
        kmPorCorrida: corridas > 0 ? km / corridas : null,
        ganhoPorKm: km > 0 ? ganhos / km : null,
      };
    }
    if (period === '7d') {
      const ganhos = sum(data.ganhos_7dias);
      const corridas = sum(data.corridas_7dias);
      const km = sum(data.km_7dias);
      const horas = 0; // não temos horas array de 7 dias reliably
      return {
        ganhos,
        corridas,
        horas,
        km,
        eficiencia: horas > 0 ? ganhos / horas : null,
        ticketMedio: corridas > 0 ? ganhos / corridas : null,
        kmPorCorrida: corridas > 0 ? km / corridas : null,
        ganhoPorKm: km > 0 ? ganhos / km : null,
      };
    }
    // 30d
    const ganhos = sum(data.ganhos_30dias);
    const corridas = sum(data.corridas_30dias);
    const km = sum(data.km_30dias);
    const horas = 0;
    return {
      ganhos,
      corridas,
      horas,
      km,
      eficiencia: horas > 0 ? ganhos / horas : null,
      ticketMedio: corridas > 0 ? ganhos / corridas : null,
      kmPorCorrida: corridas > 0 ? km / corridas : null,
      ganhoPorKm: km > 0 ? ganhos / km : null,
    };
  };

  const MetricCard = ({ title, value, subtitle, icon }: { title: string; value: string; subtitle?: string; icon: React.ReactNode }) => (
    <Card sx={cardSxColumn}>
      <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{title}</Typography>
      <Box id="cc" sx={{ display: 'flex', gap: 2 }}>
        <Box sx={{ alignItems: 'center', display: 'flex' }}>{icon}</Box>
        <Box>
          <Typography sx={{ fontSize: '1rem', color: 'success.main', fontWeight: 700 }}>{value}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
      </Box>
    </Card>
  );

  return (
    <Box sx={{ my: 1 }}>
      <Swiper spaceBetween={12} slidesPerView={1}>
        {(['today', '7d', '30d'] as const).map((period) => {
          const m = calcMetrics(period as any);
          const eficienciaDisplay = m.eficiencia != null ? formatarMoeda(Math.round(m.eficiencia)) : '—';
          const ticketDisplay = m.ticketMedio != null ? formatarMoeda(Math.round(m.ticketMedio)) : '—';
          const kmPorCorridaDisplay = m.kmPorCorrida != null ? (m.kmPorCorrida >= 100 ? Math.round(m.kmPorCorrida).toLocaleString('pt-BR') : m.kmPorCorrida.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })) + ' km' : '—';
          const ganhoPorKmDisplay = m.ganhoPorKm != null ? formatarMoeda(Number(m.ganhoPorKm.toFixed(2))) : '—';
          return (
            <SwiperSlide key={period}>
            <Box sx={{ mb: 1, mt: 4 }}>
              <SectionTitle>
                Indicadores de Saúde {
                  period === 'today'
                    ? '(hoje)'
                    : period === '7d'
                      ? '(últimos 7 dias)'
                      : period === '30d'
                        ? '(últimos 30 dias)'
                        : ''
                }
              </SectionTitle>
            </Box>
              {/* primeira linha: plataformas (Uber / 99) - grid 2 cols */}
              <Box sx={gridContainerSx}>
                <Card sx={cardSxColumn}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{UBER_NAME}</Typography>
                  <Box id="cc" sx={{ display: 'flex', gap: 2}}>                 
                    <Box sx={{ alignItems: 'center', display: 'flex' }}>
                      {renderIcon(iconeUber, corUber, UBER_NAME, <DirectionsCarIcon fontSize="small" />)}
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '1rem', color: 'success.main', fontWeight: 700 }}>{ganhosUber !== null ? formatarMoeda(ganhosUber) : '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">{corridasUber !== null ? `${corridasUber} corridas` : '—'}</Typography>
                    </Box>
                  </Box>
                </Card>

                <Card sx={cardSxColumn}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{N99_NAME}</Typography>
                  <Box id="cc" sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ alignItems: 'center', display: 'flex' }}>{renderIcon(icone99, cor99, N99_NAME, <LocalTaxiIcon fontSize="small" />)}</Box>
                    <Box>
                      <Typography sx={{ fontSize: '1rem', color: 'success.main', fontWeight: 700 }}>{ganhos99 !== null ? formatarMoeda(ganhos99) : '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">{corridas99 !== null ? `${corridas99} corridas` : '—'}</Typography>
                    </Box>
                  </Box>
                </Card>
              </Box>

              {/* segunda linha: eficiencia e ticket medio - grid */}
              <Box sx={{ ...gridContainerSx, mt: 0.5  }}>
                <Card sx={cardSxColumn}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>Eficiência ($/h)</Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ alignItems: 'center', display: 'flex' }}><AccessTimeIcon fontSize="small" /></Box>
                    <Box>
                      <Typography sx={{ fontSize: '1rem', color: 'success.main', fontWeight: 700 }}>{m.eficiencia != null ? formatarMoeda(Math.round(m.eficiencia)) : '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">{`${m.horas} horas`}</Typography>
                    </Box>
                  </Box>
                </Card>

                <Card sx={cardSxColumn}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>Ticket médio</Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ alignItems: 'center', display: 'flex' }}><PaidIcon fontSize="small" /></Box>
                    <Box>
                      <Typography sx={{ fontSize: '1rem', color: 'success.main', fontWeight: 700 }}>{m.ticketMedio != null ? formatarMoeda(Math.round(m.ticketMedio)) : '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">{`${m.corridas} corridas`}</Typography>
                    </Box>
                  </Box>
                </Card>
              </Box>

              {/* terceira linha: km/corrida e ganho/km - grid */}
              <Box sx={{ ...gridContainerSx, mt: 0.5 }}>
                <Card sx={cardSxColumn}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>KM / Corrida</Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ alignItems: 'center', display: 'flex' }}><DirectionsCarIcon fontSize="small" /></Box>
                    <Box>
                      <Typography sx={{ fontSize: '1rem', color: 'success.main', fontWeight: 700 }}>{m.kmPorCorrida != null ? (m.kmPorCorrida >= 100 ? Math.round(m.kmPorCorrida).toLocaleString('pt-BR') : m.kmPorCorrida.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })) + ' km' : '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">{`${m.corridas} corridas`}</Typography>
                    </Box>
                  </Box>
                </Card>

                <Card sx={cardSxColumn}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>Ganho / KM</Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ alignItems: 'center', display: 'flex' }}><PaidIcon fontSize="small" /></Box>
                    <Box>
                      <Typography sx={{ fontSize: '1rem', color: 'success.main', fontWeight: 700 }}>{m.ganhoPorKm != null ? formatarMoeda(Number(m.ganhoPorKm.toFixed(2))) : '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">{`Período: ${period}`}</Typography>
                    </Box>
                  </Box>
                </Card>
              </Box>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </Box>
  );
}
