"use client";
import React, { useEffect } from 'react';
import { Box, Card, CardContent, Typography, Chip } from '@mui/material';
// Swiper for multiple-goal carousel
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Goal } from '@/interfaces/goal';
import { useMetasContext } from '@/context/MetasContext';
import { GoalProgress } from '../goals/GoalProgress';
import { useUsuarioContext } from '@/context/UsuarioContext';
import { useUsuarioContext as useUsuarioContextSession } from '@/context/SessionContext';
import { formatUtcToLocalString, getUserTimezone, parseUtcToDate } from '@/utils/dateUtils';

interface Props {
  metas?: Goal[];
}

export default function GoalsList({ metas }: Props) {
  const { dispatchMetas } = useMetasContext();
  const { configuracoes } = useUsuarioContextSession();
  const userTimezone = getUserTimezone(configuracoes);

  // Função helper para formatar datas de metas com timezone
  const formatGoalDate = (dateString: string) => {
    try {
      // Parse a data e converte para timezone local
      const localDate = parseUtcToDate(dateString, userTimezone);
      return localDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  // Atualiza o contexto com as metas
  useEffect(() => {
    if (metas && metas.length > 0) {
      metas.forEach((m: Goal) => dispatchMetas(m, 'update'));
    }
  }, [metas, dispatchMetas]);

  // Se metas não foram passadas, não renderiza nada
  if (!metas || metas.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">Nenhuma meta encontrada.</Typography>
      </Box>
    );
  }

  const renderCard = (g: Goal) => (
    <Card key={g.id} elevation={2} sx={{ borderRadius: 2, bgcolor: 'background.paper', height: 240, display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}>
            {g.titulo}
          </Typography>
          <Chip
            label={g.tipo?.charAt(0).toUpperCase() + (g.tipo?.slice(1) ?? '')}
            color={g.tipo === 'faturamento' || g.tipo === 'lucro' ? 'success' : 'error'}
            size="small"
            sx={{ fontWeight: 700 }}
          />
        </Box>

        {g.descricao ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, mb: 0.5, fontSize: '0.8rem' }} noWrap>
            {g.descricao}
          </Typography>
        ) : null}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 400 }} noWrap>
            {g.data_inicio ? formatGoalDate(g.data_inicio) : '-'}
            {' '}→{' '}
            {g.data_fim ? formatGoalDate(g.data_fim) : '-'}
          </Typography>

          <Typography variant="body2" sx={{ fontWeight: 700, color: g.tipo === 'faturamento' || g.tipo === 'lucro' ? 'success.main' : 'error.main', textAlign: 'right' }}>
            {(g.valor_alvo / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </Typography>
        </Box>

        <Box sx={{ mt: 1 }}>
          <GoalProgress meta={g} isActive={!!g.eh_ativa} />
        </Box>
      </CardContent>
    </Card>
  );

  if (metas.length === 1) {
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr' }, gap: 2 }}>
        {renderCard(metas[0])}
      </Box>
    );
  }

  return (
    <Box>
      <Swiper
        spaceBetween={16}
        slidesPerView={1}
        style={{ paddingBottom: 16 }}
      >
        {metas.map((g) => (
          <SwiperSlide key={g.id}>
            {renderCard(g)}
          </SwiperSlide>
        ))}
      </Swiper>
    </Box>
  );
}
