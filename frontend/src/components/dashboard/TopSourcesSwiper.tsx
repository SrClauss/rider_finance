"use client";
import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { Card, CardContent, Typography, Box, Stack, Divider } from '@mui/material';
import Image from 'next/image';
import { formatarMoeda } from '@/utils/currencyUtils';
import SectionTitle from '../ui/SectionTitle';

interface TopSourceItem {
  periodo: string;
  tipo: string;
  categoria_id?: string | null;
  nome?: string | null;
  icone?: string | null;
  cor?: string | null;
  valor: number;
}

interface TopSources {
  receitas: TopSourceItem[];
  despesas: TopSourceItem[];
}

interface Props {
  topSources: TopSources | null;
}

// Componente unificado: um card full-width com um Swiper (diário, 7 dias, 30 dias)
export default function TopSourcesSwiper({ topSources }: Props) {

  const renderIcon = (icone?: string | null, cor?: string | null) => {
    if (!icone) return <Box sx={{ width: 32, height: 32, bgcolor: 'grey.200', borderRadius: 1 }} />;
    const v = icone.trim();
    if (/^https?:\/\//.test(v) || /\.(svg|png|jpe?g|gif|webp)(\?|$)/i.test(v)) {
      return <Image src={v} alt="icone" width={32} height={32} style={{ objectFit: 'cover', borderRadius: 4 }} unoptimized />;
    }
    return <i className={v} style={{ fontSize: 18, color: cor || undefined }} aria-hidden />;
  };

  const pickByPeriodo = (arr: TopSourceItem[] | undefined, periodo: string): TopSourceItem | null => {
    if (!arr || arr.length === 0) return null;
    return arr.find(a => a.periodo === periodo) || null;
  };

  // REFORMULADO: item sem padding/margin horizontal, ícone + info em linha, compacto
  const renderCompactItem = (item: TopSourceItem | null, tipo: 'receita' | 'despesa') => {
    const name = item?.nome ?? 'Sem dados';
    const valor = item?.valor ?? 0;
    const isPositive = tipo === 'receita';

    return (
      <Stack direction="row" alignItems="center" spacing={0} sx={{ minWidth: 0, padding: 0, margin: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: 32, height: 32 }}>
          {renderIcon(item?.icone, item?.cor)}
        </Box>

        <Box sx={{ minWidth: 0, textAlign: 'left', flexGrow: 1 }}>
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: isPositive ? 'success.main' : 'error.main',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              margin: 0,
              padding: 0
            }}
          >
            {name}
          </Typography>
          <Typography
            sx={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: isPositive ? 'success.main' : 'error.main',
              margin: 0,
              padding: 0
            }}
          >
            {isPositive ? '+' : '-'}{formatarMoeda(Math.abs(valor))}
          </Typography>
        </Box>
      </Stack>
    );
  };

  return (
    <Box sx={{width: '100%' }}>

      <SectionTitle>Principais Fontes</SectionTitle>

      
     
      <Card sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {/* Padding horizontal interno no card para evitar que itens encostem */}
        <CardContent sx={{ py: 0, px: 2 }}>
          <Swiper
            spaceBetween={10}
            slidesPerView={1}
            style={{ padding: 0 }}
            centeredSlides={false}
            watchSlidesProgress={true}
            observer={true}
            observeParents={true}
          >
            {/* Diário */}
            <SwiperSlide>
              <Box sx={{ p: 0, minHeight: 64, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    color: 'text.primary',
                    mb: 0,
                    textAlign: 'center'
                  }}
                >
                  Hoje
                </Typography>

                <Stack direction="row" spacing={0} sx={{ alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  {/* Receitas Diárias */}
                  <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start', pl: 0 }}>
                    {renderCompactItem(pickByPeriodo(topSources?.receitas, 'diario'), 'receita')}
                  </Box>

                  <Divider orientation="vertical" flexItem sx={{ mx: 0, height: 40 }} />

                  {/* Despesas Diárias */}
                  <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', pr: 0 }}>
                    {renderCompactItem(pickByPeriodo(topSources?.despesas, 'diario'), 'despesa')}
                  </Box>
                </Stack>
              </Box>
            </SwiperSlide>

            {/* Semanal */}
            <SwiperSlide>
              <Box sx={{ p: 0, minHeight: 64, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    color: 'text.primary',
                    mb: 0,
                    textAlign: 'center'
                  }}
                >
                  7 dias
                </Typography>

                <Stack direction="row" spacing={0} sx={{ alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  {/* Receitas Semanais */}
                  <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start', pl: 0 }}>
                    {renderCompactItem(pickByPeriodo(topSources?.receitas, '7dias'), 'receita')}
                  </Box>

                  <Divider orientation="vertical" flexItem sx={{ mx: 0, height: 40 }} />

                  {/* Despesas Semanais */}
                  <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', pr: 0 }}>
                    {renderCompactItem(pickByPeriodo(topSources?.despesas, '7dias'), 'despesa')}
                  </Box>
                </Stack>
              </Box>
            </SwiperSlide>

            {/* Mensal */}
            <SwiperSlide>
              <Box sx={{ p: 0, minHeight: 64, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    color: 'text.primary',
                    mb: 0,
                    textAlign: 'center'
                  }}
                >
                  30 dias
                </Typography>

                <Stack direction="row" spacing={0} sx={{ alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  {/* Receitas Mensais */}
                  <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start', pl: 0 }}>
                    {renderCompactItem(pickByPeriodo(topSources?.receitas, '30dias'), 'receita')}
                  </Box>

                  <Divider orientation="vertical" flexItem sx={{ mx: 0, height: 40 }} />

                  {/* Despesas Mensais */}
                  <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', pr: 0 }}>
                    {renderCompactItem(pickByPeriodo(topSources?.despesas, '30dias'), 'despesa')}
                  </Box>
                </Stack>
              </Box>
            </SwiperSlide>
          </Swiper>
        </CardContent>
      </Card>

    </Box>
  );
}
