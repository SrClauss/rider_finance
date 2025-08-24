"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { DashboardResponse } from "@/interfaces/DashboardResponse";
import LoggedLayout from "@/layouts/LoggedLayout";
import {
  AttachMoney,
  MoneyOff,
  Savings,
  LocalTaxi,
  AccessTime,
  TrendingUp,
  TrendingDown,
  Speed,
  Flag,
} from "@mui/icons-material";
import {
  Box,
  useMediaQuery,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Stack,
  Paper,
  Tabs,
  Tab,
  Fade,
  Skeleton,
  Alert,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import DashboardLineChartCard from "@/components/dashboard/DashboardLineChartCard";
import DashboardCardData from "@/components/dashboard/DashboardCardData";

type PeriodoType = "diario" | "semanal" | "mensal";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Page() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<PeriodoType>("diario");
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    axios
      .get("/api/dashboard/stats", { withCredentials: true })
      .then((res) => setData(res.data))
      .catch(() => setError("Erro ao buscar dados do dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const handlePeriodoChange = (
    _event: React.MouseEvent<HTMLElement>,
    newPeriodo: PeriodoType | null
  ) => {
    if (newPeriodo !== null) {
      setPeriodo(newPeriodo);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Função para obter os KPIs baseados no período selecionado
  const getKPIsForPeriodo = () => {
    if (!data) return { ganhos: 0, gastos: 0, lucro: 0 };

    switch (periodo) {
      case "diario":
        return {
          ganhos: data.ganhos_hoje ?? 0,
          gastos: data.gastos_hoje ?? 0,
          lucro: data.lucro_hoje ?? 0,
          ganhosPrev: data.ganhos_ontem,
          gastosPrev: data.gastos_ontem,
          lucroPrev: data.lucro_ontem,
        };
      case "semanal":
        return {
          ganhos: data.ganhos_semana ?? 0,
          gastos: data.gastos_semana ?? 0,
          lucro: data.lucro_semana ?? 0,
          ganhosPrev: data.ganhos_semana_passada,
          gastosPrev: data.gastos_semana_passada,
          lucroPrev: data.lucro_semana_passada,
        };
      case "mensal":
        return {
          ganhos: data.ganhos_mes ?? 0,
          gastos: data.gastos_mes ?? 0,
          lucro: data.lucro_mes ?? 0,
          ganhosPrev: data.ganhos_mes_passado,
          gastosPrev: data.gastos_mes_passado,
          lucroPrev: data.lucro_mes_passado,
        };
    }
  };

  // Função para obter métricas operacionais
  const getMetricasOperacionais = () => {
    if (!data) return { corridas: 0, horas: 0 };

    switch (periodo) {
      case "diario":
        return {
          corridas: data.corridas_hoje ?? 0,
          horas: data.horas_hoje ?? 0,
          corridasPrev: data.corridas_ontem,
          horasPrev: data.horas_ontem,
        };
      case "semanal":
        return {
          corridas: data.corridas_semana ?? 0,
          horas: data.horas_semana ?? 0,
          corridasPrev: data.corridas_semana_passada,
          horasPrev: data.horas_semana_passada,
        };
      case "mensal":
        return {
          corridas: data.corridas_mes ?? 0,
          horas: data.horas_mes ?? 0,
          corridasPrev: data.corridas_mes_passado,
          horasPrev: data.horas_mes_passado,
        };
    }
  };

  const kpis = getKPIsForPeriodo();
  const metricas = getMetricasOperacionais();

  if (loading) {
    return (
      <LoggedLayout>
        <Box sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Skeleton variant="rectangular" height={60} />
            <Skeleton variant="rectangular" height={200} />
            <Skeleton variant="rectangular" height={400} />
          </Stack>
        </Box>
      </LoggedLayout>
    );
  }

  if (error) {
    return (
      <LoggedLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </LoggedLayout>
    );
  }

  return (
    <LoggedLayout>
      <Box sx={{ p: isMobile ? 2 : 3 }}>
        {/* Header com Filtros de Período */}
        <Fade in timeout={500}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              mb: 3,
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 2,
            }}
          >
            <Stack
              direction={isMobile ? "column" : "row"}
              alignItems="center"
              justifyContent="space-between"
              spacing={2}
            >
              <Typography
                variant="h5"
                sx={{
                  color: "white",
                  fontWeight: 700,
                  textAlign: isMobile ? "center" : "left",
                }}
              >
                Dashboard Financeiro
              </Typography>
              
              <ToggleButtonGroup
                value={periodo}
                exclusive
                onChange={handlePeriodoChange}
                aria-label="período do dashboard"
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: 2,
                  "& .MuiToggleButton-root": {
                    color: "white",
                    borderColor: "transparent",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                    },
                    "&.Mui-selected": {
                      backgroundColor: "rgba(255, 255, 255, 0.3)",
                      color: "white",
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.4)",
                      },
                    },
                  },
                }}
              >
                <ToggleButton value="diario" aria-label="período diário">
                  Diário
                </ToggleButton>
                <ToggleButton value="semanal" aria-label="período semanal">
                  Semanal
                </ToggleButton>
                <ToggleButton value="mensal" aria-label="período mensal">
                  Mensal
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Paper>
        </Fade>

        {/* Seção de Resumo Principal - KPIs Chave */}
        <Fade in timeout={700}>
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.secondary }}
            >
              Resumo Financeiro
            </Typography>
            
            {isMobile ? (
              <Swiper
                modules={[Pagination, Autoplay]}
                spaceBetween={20}
                slidesPerView={1}
                pagination={{ clickable: true }}
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                style={{ paddingBottom: "40px" }}
              >
                <SwiperSlide>
                  <DashboardCardData
                    label={`Lucro ${periodo === "diario" ? "Hoje" : periodo === "semanal" ? "Semana" : "Mês"}`}
                    value={kpis.lucro}
                    color="azul"
                    icon={<Savings sx={{ fontSize: 40 }} />}
                    periodoAnterior={kpis.lucroPrev ?? null}
                    mod="currency"
                  />
                </SwiperSlide>
                <SwiperSlide>
                  <DashboardCardData
                    label={`Ganhos ${periodo === "diario" ? "Hoje" : periodo === "semanal" ? "Semana" : "Mês"}`}
                    value={kpis.ganhos}
                    color="verde"
                    icon={<AttachMoney sx={{ fontSize: 40 }} />}
                    periodoAnterior={kpis.ganhosPrev ?? null}
                    mod="currency"
                  />
                </SwiperSlide>
                <SwiperSlide>
                  <DashboardCardData
                    label={`Gastos ${periodo === "diario" ? "Hoje" : periodo === "semanal" ? "Semana" : "Mês"}`}
                    value={kpis.gastos}
                    color="vermelha"
                    icon={<MoneyOff sx={{ fontSize: 40 }} />}
                    periodoAnterior={kpis.gastosPrev ?? null}
                    mod="currency"
                  />
                </SwiperSlide>
              </Swiper>
            ) : (
              <Stack
                direction={isTablet ? "column" : "row"}
                spacing={3}
                sx={{ width: "100%" }}
              >
                <Box sx={{ flex: 1 }}>
                  <DashboardCardData
                    label={`Lucro ${periodo === "diario" ? "Hoje" : periodo === "semanal" ? "Semana" : "Mês"}`}
                    value={kpis.lucro}
                    color="azul"
                    icon={<Savings sx={{ fontSize: 40 }} />}
                    periodoAnterior={kpis.lucroPrev ?? null}
                    mod="currency"
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <DashboardCardData
                    label={`Ganhos ${periodo === "diario" ? "Hoje" : periodo === "semanal" ? "Semana" : "Mês"}`}
                    value={kpis.ganhos}
                    color="verde"
                    icon={<AttachMoney sx={{ fontSize: 40 }} />}
                    periodoAnterior={kpis.ganhosPrev ?? null}
                    mod="currency"
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <DashboardCardData
                    label={`Gastos ${periodo === "diario" ? "Hoje" : periodo === "semanal" ? "Semana" : "Mês"}`}
                    value={kpis.gastos}
                    color="vermelha"
                    icon={<MoneyOff sx={{ fontSize: 40 }} />}
                    periodoAnterior={kpis.gastosPrev ?? null}
                    mod="currency"
                  />
                </Box>
              </Stack>
            )}
          </Box>
        </Fade>

        {/* Visualização de Dados com Tabs */}
        <Fade in timeout={900}>
          <Paper elevation={2} sx={{ mb: 4, borderRadius: 2 }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant={isMobile ? "fullWidth" : "standard"}
                scrollButtons={isMobile ? false : "auto"}
                allowScrollButtonsMobile
                sx={{
                  "& .MuiTab-root": {
                    textTransform: "none",
                    fontWeight: 600,
                  },
                }}
              >
                <Tab label="Ganhos" icon={<TrendingUp />} iconPosition="start" />
                <Tab label="Gastos" icon={<TrendingDown />} iconPosition="start" />
                <Tab label="Lucro" icon={<Savings />} iconPosition="start" />
                <Tab label="Corridas" icon={<LocalTaxi />} iconPosition="start" />
              </Tabs>
            </Box>

            <Box sx={{ p: 2 }}>
              <TabPanel value={tabValue} index={0}>
                <Stack spacing={3}>
                  {data?.ganhos_7dias && data.ganhos_7dias.length > 0 && (
                    <DashboardLineChartCard
                      label="Ganhos - Últimos 7 dias"
                      series={data.ganhos_7dias}
                      color="#388e3c"
                    />
                  )}
                  {data?.ganhos_30dias && data.ganhos_30dias.length > 0 && (
                    <DashboardLineChartCard
                      label="Ganhos - Últimos 30 dias"
                      series={data.ganhos_30dias}
                      color="#388e3c"
                      labels={data.ultimos_30_dias_labels}
                    />
                  )}
                </Stack>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Stack spacing={3}>
                  {data?.gastos_7dias && data.gastos_7dias.length > 0 && (
                    <DashboardLineChartCard
                      label="Gastos - Últimos 7 dias"
                      series={data.gastos_7dias}
                      color="#c62828"
                    />
                  )}
                  {data?.gastos_30dias && data.gastos_30dias.length > 0 && (
                    <DashboardLineChartCard
                      label="Gastos - Últimos 30 dias"
                      series={data.gastos_30dias}
                      color="#c62828"
                      labels={data.ultimos_30_dias_labels}
                    />
                  )}
                </Stack>
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <Stack spacing={3}>
                  {data?.lucro_7dias && data.lucro_7dias.length > 0 && (
                    <DashboardLineChartCard
                      label="Lucro - Últimos 7 dias"
                      series={data.lucro_7dias}
                      color="#1976d2"
                    />
                  )}
                  {data?.lucro_30dias && data.lucro_30dias.length > 0 && (
                    <DashboardLineChartCard
                      label="Lucro - Últimos 30 dias"
                      series={data.lucro_30dias}
                      color="#1976d2"
                      labels={data.ultimos_30_dias_labels}
                    />
                  )}
                </Stack>
              </TabPanel>

              <TabPanel value={tabValue} index={3}>
                <Stack spacing={3}>
                  {data?.corridas_7dias && data.corridas_7dias.length > 0 && (
                    <DashboardLineChartCard
                      label="Corridas - Últimos 7 dias"
                      series={data.corridas_7dias}
                      color="#bdb200"
                    />
                  )}
                  {data?.corridas_30dias && data.corridas_30dias.length > 0 && (
                    <DashboardLineChartCard
                      label="Corridas - Últimos 30 dias"
                      series={data.corridas_30dias}
                      color="#bdb200"
                      labels={data.ultimos_30_dias_labels}
                    />
                  )}
                </Stack>
              </TabPanel>
            </Box>
          </Paper>
        </Fade>

        {/* Seção de Métricas Operacionais */}
        <Fade in timeout={1100}>
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.secondary }}
            >
              Métricas Operacionais
            </Typography>
            
            <Stack
              direction={isMobile ? "column" : "row"}
              spacing={3}
              sx={{ width: "100%" }}
            >
              <Box sx={{ flex: 1 }}>
                <DashboardCardData
                  label={`Corridas ${periodo === "diario" ? "Hoje" : periodo === "semanal" ? "Semana" : "Mês"}`}
                  value={metricas.corridas}
                  color="amarela"
                  icon={<LocalTaxi sx={{ fontSize: 35 }} />}
                  periodoAnterior={metricas.corridasPrev ?? null}
                  mod="default"
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <DashboardCardData
                  label={`Horas Trabalhadas ${periodo === "diario" ? "Hoje" : periodo === "semanal" ? "Semana" : "Mês"}`}
                  value={metricas.horas}
                  color="azul"
                  icon={<AccessTime sx={{ fontSize: 35 }} />}
                  periodoAnterior={metricas.horasPrev ?? null}
                  mod="default"
                />
              </Box>
            </Stack>
          </Box>
        </Fade>

        {/* Seção de Metas e Eficiência */}
        <Fade in timeout={1300}>
          <Box>
            <Typography
              variant="h6"
              sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.secondary }}
            >
              Metas e Performance
            </Typography>
            
            <Stack
              direction={isMobile ? "column" : "row"}
              spacing={3}
              sx={{ width: "100%" }}
            >
              <Box sx={{ flex: 1 }}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Speed sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Eficiência
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {data?.eficiencia ? `${data.eficiencia}%` : "-"}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                    color: "white",
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Flag sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Meta Diária
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {data?.meta_diaria
                          ? `R$ ${data.meta_diaria.toFixed(2)}`
                          : "-"}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                    color: "white",
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Flag sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Meta Semanal
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {data?.meta_semanal
                          ? `R$ ${data.meta_semanal.toFixed(2)}`
                          : "-"}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Box>
            </Stack>
          </Box>
        </Fade>
      </Box>
    </LoggedLayout>
  );
}