"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import DashboardCardData from "@/components/dashboard/DashboardCardData";
import { DashboardResponse } from "@/interfaces/DashboardResponse";
import LoggedLayout from "@/layouts/LoggedLayout";
import { Box, useMediaQuery, Divider, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import RouteTransition from "@/components/transitions/RouteTransition";
import "swiper/css";

import SummarySwiper from "@/components/dashboard/SummarySwiper"; // Importar o SummarySwiper
import LastTransactionsCard from '@/components/dashboard/LastTransactionsCard';

export default function Page() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios.get('/api/dashboard/stats', { withCredentials: true })
      .then((res) => setData(res.data))
      .catch(() => setError('Erro ao buscar dados do dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <RouteTransition message="Carregando dash" />;
  if (error) return <div>{error}</div>;

  return (
    <LoggedLayout>
      {/* título 'Resumo' com divider à direita, conforme modificações do usuário */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, mt: 4 }}>
        <Typography variant="h6">Resumo</Typography>
        <Divider sx={{ flex: 1, height: 1, bgcolor: 'white', borderRadius: 1, opacity: 0.95 }} />
      </Box>
      <SummarySwiper data={data!} /> {/* Substituir SummaryTodayCard por SummarySwiper */}

      {/* título com divider à direita, mais destacado */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 3 }}>
        <Typography variant="h6">Últimas transações</Typography>
        <Divider sx={{ flex: 1, height: 1, bgcolor: 'white', borderRadius: 1, opacity: 0.95 }} />
      </Box>
      <LastTransactionsCard />

      <pre>{JSON.stringify(data, null, 2)}</pre>
    </LoggedLayout>
  );
}
