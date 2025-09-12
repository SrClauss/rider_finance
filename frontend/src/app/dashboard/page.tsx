"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { DashboardResponse } from "@/interfaces/DashboardResponse";
import LoggedLayout from "@/layouts/LoggedLayout";
import { Box } from "@mui/material";
import RouteTransition from "@/components/transitions/RouteTransition";
import "swiper/css";
import SectionTitle from '@/components/ui/SectionTitle';
import SummarySwiper from "@/components/dashboard/SummarySwiper"; // Importar o SummarySwiper
import LastTransactionsCard from '@/components/dashboard/LastTransactionsCard';
import QuickHealthIndicators from '@/components/dashboard/QuickHealthIndicators';
import TopSourcesSwiper from '@/components/dashboard/TopSourcesSwiper';
import ProjectionsCard from '@/components/dashboard/ProjectionsCard';
import GoalsList from "@/components/dashboard/GoalsList";
import { Goal } from '@/interfaces/goal';
import Dashboard30Days from '@/components/charts/Dashboard30Days';
import CorridasHoras from '@/components/charts/CorridasHoras';
// useUsuarioContext não é necessário aqui


export default function Page() {

  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMetas, setHasMetas] = useState<boolean | null>(null);
  const [metas, setMetas] = useState<Goal[]>([]);
  // usuário context não necessário nesta página no momento

  useEffect(() => {
    axios.get('/api/dashboard/stats', { withCredentials: true })
      .then((res) => setData(res.data))
      .catch(() => setError('Erro ao buscar dados do dashboard'))
      .finally(() => setLoading(false));
    // checar se existem metas ativas para decidir renderizar a seção
    (async () => {
      try {
        const res = await axios.get('/api/meta/a_cumprir', { withCredentials: true });
        if (Array.isArray(res.data) && res.data.length > 0) {
          setHasMetas(true);
          setMetas(res.data as Goal[]);
        } else {
          setHasMetas(false);
          setMetas([]);
        }
  } catch {
        setHasMetas(false);
        setMetas([]);
      }
    })();
  }, []);

  if (loading) return <RouteTransition message="Carregando dash" />;
  if (error) return <div>{error}</div>;

  return (
    <LoggedLayout>

      {/* título 'Resumo' com divider à direita, conforme modificações do usuário */}
      <Box sx={{ mb: 1, mt: 4 }}>
        <SectionTitle>Resumo</SectionTitle>
      </Box>


      <SummarySwiper data={data!} /> {/* Substituir SummaryTodayCard por SummarySwiper */}

      <Box sx={{ mb: 1, mt: 4 }}>
        <SectionTitle>Indicadores de Saúde</SectionTitle>
      </Box>
      <QuickHealthIndicators data={data!} />

      <TopSourcesSwiper topSources={data?.top_sources || null} />
      <Box sx={{ mt: 2 }}>
        <ProjectionsCard
          weekly={data?.projecao_semana ?? 0}
          monthly={data?.projecao_mes ?? 0}
          method={data?.trend_method}
        />
      </Box>

      {/* título com divider à direita, mais destacado */}
      <SectionTitle>Últimas transações</SectionTitle>
      <LastTransactionsCard />
      {hasMetas ? (
        <>
          <SectionTitle>Metas Ativas</SectionTitle>
          <GoalsList metas={metas} />
        </>
      ) : null}

      {/* Charts: 30 dias, corridas/horas, sparklines e waterfall */}
      <SectionTitle>Ganhos / Gastos / Lucro (30 dias)</SectionTitle>
      <Dashboard30Days data={data!} />

      <SectionTitle>Corridas e Horas (30 dias)</SectionTitle>
      <CorridasHoras data={data!} />
    </LoggedLayout>
  );
}
