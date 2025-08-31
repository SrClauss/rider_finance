"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import DashboardCardData from "@/components/dashboard/DashboardCardData";
import { DashboardResponse } from "@/interfaces/DashboardResponse";
import LoggedLayout from "@/layouts/LoggedLayout";
import {
  AttachMoney,
  MoneyOff,
  Savings,
  LocalTaxi,
  AccessTime,
} from "@mui/icons-material";
import { Box, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import RouteTransition from "@/components/RouteTransition";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import DashboardLineChartCard from "@/components/dashboard/DashboardLineChartCard";
import DashboardSimpleCard from "@/components/dashboard/DashboardSimpleCard";

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
  <Box sx={{ padding: 5 }}>
        {/* MOBILE: Swipers por categoria */}
        {/* CARDS RESPONSIVOS */}
        {isMobile ? (
          <Box>
            {/* Ganhos */}
            <Box sx={{ maxWidth: 400, mx: "auto", mb: 3, width: "100%" }}>
              <Swiper
                spaceBetween={45}
                slidesPerView={1}
                style={{
                  width: "100%",
                  flexDirection: "column",
                  justifyContent: "center",
                  paddingRight: "10%",
                }}
              >
                <SwiperSlide>
                  <Box sx={{ width: "100%" }}>
                    <DashboardCardData
                      label="Ganhos Hoje"
                      value={data?.ganhos_hoje ?? 0}
                      color="verde"
                      icon={<AttachMoney />}
                      periodoAnterior={data?.ganhos_ontem ?? null}
                      mod="currency"
                    />
                  </Box>
                </SwiperSlide>
                <SwiperSlide>
                  <Box sx={{ width: "100%" }}>
                    <DashboardCardData
                      label="Ganhos Semana"
                      value={data?.ganhos_semana ?? 0}
                      color="verde"
                      icon={<AttachMoney />}
                      periodoAnterior={data?.ganhos_semana_passada ?? null}
                      mod="currency"
                    />
                  </Box>
                </SwiperSlide>
                <SwiperSlide>
                  <Box sx={{ width: "100%" }}>
                    <DashboardCardData
                      label="Ganhos Mês"
                      value={data?.ganhos_mes ?? 0}
                      color="verde"
                      icon={<AttachMoney />}
                      periodoAnterior={data?.ganhos_mes_passado ?? null}
                      mod="currency"
                    />
                  </Box>
                </SwiperSlide>
              </Swiper>
            </Box>
            {/* Gastos */}
            <Box sx={{ maxWidth: 400, mx: "auto", mb: 3, width: "100%" }}>
              <Swiper
                spaceBetween={45}
                slidesPerView={1}
                style={{
                  width: "100%",
                  flexDirection: "column",
                  justifyContent: "center",
                  paddingRight: "10%",
                }}
              >
                <SwiperSlide>
                  <Box sx={{ width: "100%" }}>
                    <DashboardCardData
                      label="Gastos Hoje"
                      value={data?.gastos_hoje ?? 0}
                      color="vermelha"
                      icon={<MoneyOff />}
                      periodoAnterior={data?.gastos_ontem ?? null}
                      mod="currency"
                    />
                  </Box>
                </SwiperSlide>
                <SwiperSlide>
                  <Box sx={{ width: "100%" }}>
                    <DashboardCardData
                      label="Gastos Semana"
                      value={data?.gastos_semana ?? 0}
                      color="vermelha"
                      icon={<MoneyOff />}
                      periodoAnterior={data?.gastos_semana_passada ?? null}
                      mod="currency"
                    />
                  </Box>
                </SwiperSlide>
                <SwiperSlide>
                  <Box sx={{ width: "100%" }}>
                    <DashboardCardData
                      label="Gastos Mês"
                      value={data?.gastos_mes ?? 0}
                      color="vermelha"
                      icon={<MoneyOff />}
                      periodoAnterior={data?.gastos_mes_passado ?? null}
                      mod="currency"
                    />
                  </Box>
                </SwiperSlide>
              </Swiper>
            </Box>
            {/* Lucro */}
            <Box sx={{ maxWidth: 400, mx: "auto", mb: 3, width: "100%" }}>
              <Swiper
                spaceBetween={45}
                slidesPerView={1}
                style={{
                  width: "100%",
                  flexDirection: "column",
                  justifyContent: "center",
                  paddingRight: "10%",
                }}
              >
                <SwiperSlide>
                  <Box sx={{ width: "100%" }}>
                    <DashboardCardData
                      label="Lucro Hoje"
                      value={data?.lucro_hoje ?? 0}
                      color="azul"
                      icon={<Savings />}
                      periodoAnterior={data?.lucro_ontem ?? null}
                      mod="currency"
                    />
                  </Box>
                </SwiperSlide>
                <SwiperSlide>
                  <Box sx={{ width: "100%" }}>
                    <DashboardCardData
                      label="Lucro Semana"
                      value={data?.lucro_semana ?? 0}
                      color="azul"
                      icon={<Savings />}
                      periodoAnterior={data?.lucro_semana_passada ?? null}
                      mod="currency"
                    />
                  </Box>
                </SwiperSlide>
                <SwiperSlide>
                  <Box sx={{ width: "100%" }}>
                    <DashboardCardData
                      label="Lucro Mês"
                      value={data?.lucro_mes ?? 0}
                      color="azul"
                      icon={<Savings />}
                      periodoAnterior={data?.lucro_mes_passado ?? null}
                      mod="currency"
                    />
                  </Box>
                </SwiperSlide>
              </Swiper>
            </Box>
            {/* Corridas */}
            <Box sx={{ maxWidth: 400, mx: "auto", mb: 3, width: "100%" }}>
              <Swiper
                spaceBetween={45}
                slidesPerView={1}
                style={{
                  width: "100%",
                  flexDirection: "column",
                  justifyContent: "center",
                  paddingRight: "10%",
                }}
              >
                <SwiperSlide>
                  <Box sx={{ width: "100%" }}>
                    <DashboardCardData
                      label="Corridas Hoje"
                      value={data?.corridas_hoje ?? 0}
                      color="amarela"
                      icon={<LocalTaxi />}
                      periodoAnterior={data?.corridas_ontem ?? null}
                      mod="default"
                    />
                  </Box>
                </SwiperSlide>
                <SwiperSlide>
                  <Box sx={{ width: "100%" }}>
                    <DashboardCardData
                      label="Corridas Semana"
                      value={data?.corridas_semana ?? 0}
                      color="amarela"
                      icon={<LocalTaxi />}
                      periodoAnterior={data?.corridas_semana_passada ?? null}
                      mod="default"
                    />
                  </Box>
                </SwiperSlide>
                <SwiperSlide>
                  <Box sx={{ width: "100%" }}>
                    <DashboardCardData
                      label="Corridas Mês"
                      value={data?.corridas_mes ?? 0}
                      color="amarela"
                      icon={<LocalTaxi />}
                      periodoAnterior={data?.corridas_mes_passado ?? null}
                      mod="default"
                    />
                  </Box>
                </SwiperSlide>
              </Swiper>
            </Box>
            {/* Horas */}
            <Box sx={{ maxWidth: 400, mx: "auto", mb: 3, width: "100%" }}>
              <Swiper
                spaceBetween={45}
                slidesPerView={1}
                style={{
                  width: "100%",
                  flexDirection: "column",
                  justifyContent: "center",
                  paddingRight: "10%",
                }}
              >
                <SwiperSlide>
                  <Box sx={{ width: "100%" }}>
                    <DashboardCardData
                      label="Horas Hoje"
                      value={data?.horas_hoje ?? 0}
                      color="azul"
                      icon={<AccessTime />}
                      periodoAnterior={data?.horas_ontem ?? null}
                      mod="default"
                    />
                  </Box>
                </SwiperSlide>
                <SwiperSlide>
                  <Box sx={{ width: "100%" }}>
                    <DashboardCardData
                      label="Horas Semana"
                      value={data?.horas_semana ?? 0}
                      color="azul"
                      icon={<AccessTime />}
                      periodoAnterior={data?.horas_semana_passada ?? null}
                      mod="default"
                    />
                  </Box>
                </SwiperSlide>
                <SwiperSlide>
                  <Box sx={{ width: "100%" }}>
                    <DashboardCardData
                      label="Horas Mês"
                      value={data?.horas_mes ?? 0}
                      color="azul"
                      icon={<AccessTime />}
                      periodoAnterior={data?.horas_mes_passado ?? null}
                      mod="default"
                    />
                  </Box>
                </SwiperSlide>
              </Swiper>
            </Box>
            <Box sx={{ maxWidth: 400, mx: "auto", mb: 3, width: "100%" }}>
              <Swiper
                spaceBetween={45}
                slidesPerView={1}
                style={{
                  width: "100%",
                  flexDirection: "column",
                  justifyContent: "center",
                  paddingRight: "10%",
                }}
              >
                <SwiperSlide>
                  <Box sx={{ width: "100%" }}>
                    <DashboardSimpleCard
                      label="Meta Semanal"
                      value={data?.meta_semanal ?? "-"}
                      color="#1976d2"
                      mod="currency"
                    />
                  </Box>
                </SwiperSlide>
                <SwiperSlide>
                  <Box sx={{ width: "100%" }}>
                    <DashboardSimpleCard
                      label="Eficiência"
                      value={data?.eficiencia ?? "-"}
                      color="#00bcd4"
                      mod="percent"
                    />
                  </Box>
                </SwiperSlide>
              </Swiper>
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              mb: 3,
              justifyContent: "center",
            }}
          >
            <Box sx={{ flex: "1 1 300px", maxWidth: 350 }}>
              <DashboardCardData
                label="Ganhos Hoje"
                value={data?.ganhos_hoje ?? 0}
                color="verde"
                icon={<AttachMoney />}
                periodoAnterior={data?.ganhos_ontem ?? null}
                mod="currency"
              />
            </Box>
            <Box sx={{ flex: "1 1 300px", maxWidth: 350 }}>
              <DashboardCardData
                label="Ganhos Semana"
                value={data?.ganhos_semana ?? 0}
                color="verde"
                icon={<AttachMoney />}
                periodoAnterior={data?.ganhos_semana_passada ?? null}
                mod="currency"
              />
            </Box>
            <Box sx={{ flex: "1 1 300px", maxWidth: 350 }}>
              <DashboardCardData
                label="Ganhos Mês"
                value={data?.ganhos_mes ?? 0}
                color="verde"
                icon={<AttachMoney />}
                periodoAnterior={data?.ganhos_mes_passado ?? null}
                mod="currency"
              />
            </Box>
            <Box sx={{ flex: "1 1 300px", maxWidth: 350 }}>
              <DashboardCardData
                label="Gastos Hoje"
                value={data?.gastos_hoje ?? 0}
                color="vermelha"
                icon={<MoneyOff />}
                periodoAnterior={data?.gastos_ontem ?? null}
                mod="currency"
              />
            </Box>
            <Box sx={{ flex: "1 1 300px", maxWidth: 350 }}>
              <DashboardCardData
                label="Gastos Semana"
                value={data?.gastos_semana ?? 0}
                color="vermelha"
                icon={<MoneyOff />}
                periodoAnterior={data?.gastos_semana_passada ?? null}
                mod="currency"
              />
            </Box>
            <Box sx={{ flex: "1 1 300px", maxWidth: 350 }}>
              <DashboardCardData
                label="Gastos Mês"
                value={data?.gastos_mes ?? 0}
                color="vermelha"
                icon={<MoneyOff />}
                periodoAnterior={data?.gastos_mes_passado ?? null}
                mod="currency"
              />
            </Box>
            <Box sx={{ flex: "1 1 300px", maxWidth: 350 }}>
              <DashboardCardData
                label="Lucro Hoje"
                value={data?.lucro_hoje ?? 0}
                color="azul"
                icon={<Savings />}
                periodoAnterior={data?.lucro_ontem ?? null}
                mod="currency"
              />
            </Box>
            <Box sx={{ flex: "1 1 300px", maxWidth: 350 }}>
              <DashboardCardData
                label="Lucro Semana"
                value={data?.lucro_semana ?? 0}
                color="azul"
                icon={<Savings />}
                periodoAnterior={data?.lucro_semana_passada ?? null}
                mod="currency"
              />
            </Box>
            <Box sx={{ flex: "1 1 300px", maxWidth: 350 }}>
              <DashboardCardData
                label="Lucro Mês"
                value={data?.lucro_mes ?? 0}
                color="azul"
                icon={<Savings />}
                periodoAnterior={data?.lucro_mes_passado ?? null}
                mod="currency"
              />
            </Box>
            <Box sx={{ flex: "1 1 300px", maxWidth: 350 }}>
              <DashboardCardData
                label="Corridas Hoje"
                value={data?.corridas_hoje ?? 0}
                color="amarela"
                icon={<LocalTaxi />}
                periodoAnterior={data?.corridas_ontem ?? null}
                mod="default"
              />
            </Box>
            <Box sx={{ flex: "1 1 300px", maxWidth: 350 }}>
              <DashboardCardData
                label="Corridas Semana"
                value={data?.corridas_semana ?? 0}
                color="amarela"
                icon={<LocalTaxi />}
                periodoAnterior={data?.corridas_semana_passada ?? null}
                mod="default"
              />
            </Box>
            <Box sx={{ flex: "1 1 300px", maxWidth: 350 }}>
              <DashboardCardData
                label="Corridas Mês"
                value={data?.corridas_mes ?? 0}
                color="amarela"
                icon={<LocalTaxi />}
                periodoAnterior={data?.corridas_mes_passado ?? null}
                mod="default"
              />
            </Box>
            <Box sx={{ flex: "1 1 300px", maxWidth: 350 }}>
              <DashboardCardData
                label="Horas Hoje"
                value={data?.horas_hoje ?? 0}
                color="azul"
                icon={<AccessTime />}
                periodoAnterior={data?.horas_ontem ?? null}
                mod="default"
              />
            </Box>
            <Box sx={{ flex: "1 1 300px", maxWidth: 350 }}>
              <DashboardCardData
                label="Horas Semana"
                value={data?.horas_semana ?? 0}
                color="azul"
                icon={<AccessTime />}
                periodoAnterior={data?.horas_semana_passada ?? null}
                mod="default"
              />
            </Box>
            <Box sx={{ flex: "1 1 300px", maxWidth: 350 }}>
              <DashboardCardData
                label="Horas Mês"
                value={data?.horas_mes ?? 0}
                color="azul"
                icon={<AccessTime />}
                periodoAnterior={data?.horas_mes_passado ?? null}
                mod="default"
              />
            </Box>
          </Box>
        )}
        {/* GRÁFICOS - Exemplo de uso, ajuste conforme os dados disponíveis */}
        <Box sx={{ mt: 4, backgroundColor: "#181a20" }}>
          {/* Gráficos para todos os arrays do DashboardResponse */}
          <Box sx={{ width: "100%", mb: 3 }}>
            <DashboardLineChartCard
              label="Ganhos 30 dias"
              series={data?.ganhos_30dias ?? []}
              color="#388e3c"
              labels={data?.ultimos_30_dias_labels ?? []}
            />
          </Box>
          <Box sx={{ width: "100%", mb: 3 }}>
            <DashboardLineChartCard
              label="Gastos 30 dias"
              series={data?.gastos_30dias ?? []}
              color="#c62828"
              labels={data?.ultimos_30_dias_labels ?? []}
            />
          </Box>
          <Box sx={{ width: "100%", mb: 3 }}>
            <DashboardLineChartCard
              label="Lucro 30 dias"
              series={data?.lucro_30dias ?? []}
              color="#1976d2"
              labels={data?.ultimos_30_dias_labels ?? []}
            />
          </Box>
          <Box sx={{ width: "100%", mb: 3 }}>
            <DashboardLineChartCard
              label="Corridas 30 dias"
              series={data?.corridas_30dias ?? []}
              color="#bdb200"
              labels={data?.ultimos_30_dias_labels ?? []}
            />
          </Box>
          {data?.ganhos_mes_array && data.ganhos_mes_array.length > 0 && (
            <Box sx={{ width: "100%", mb: 3 }}>
              <DashboardLineChartCard
                label="Ganhos Mês"
                series={data.ganhos_mes_array}
                color="#388e3c"
                labels={data?.ultimos_30_dias_labels ?? []}
              />
            </Box>
          )}
          {data?.gastos_mes_array && data.gastos_mes_array.length > 0 && (
            <Box sx={{ width: "100%", mb: 3 }}>
              <DashboardLineChartCard
                label="Gastos Mês"
                series={data.gastos_mes_array}
                color="#c62828"
                labels={data?.ultimos_30_dias_labels ?? []}
              />
            </Box>
          )}
          {data?.lucro_mes_array && data.lucro_mes_array.length > 0 && (
            <Box sx={{ width: "100%", mb: 3 }}>
              <DashboardLineChartCard
                label="Lucro Mês"
                series={data.lucro_mes_array}
                color="#1976d2"
                labels={data?.ultimos_30_dias_labels ?? []}
              />
            </Box>
          )}
          {data?.corridas_mes_array && data.corridas_mes_array.length > 0 && (
            <Box sx={{ width: "100%", mb: 3 }}>
              <DashboardLineChartCard
                label="Corridas Mês"
                series={data.corridas_mes_array}
                color="#bdb200"
                labels={data?.ultimos_30_dias_labels ?? []}
              />
            </Box>
          )}
          {data?.ganhos_7dias && data.ganhos_7dias.length > 0 && (
            <Box sx={{ width: "100%", mb: 3 }}>
              <DashboardLineChartCard
                label="Ganhos 7 dias"
                series={data.ganhos_7dias}
                color="#388e3c"
              />
            </Box>
          )}
          {data?.gastos_7dias && data.gastos_7dias.length > 0 && (
            <Box sx={{ width: "100%", mb: 3 }}>
              <DashboardLineChartCard
                label="Gastos 7 dias"
                series={data.gastos_7dias}
                color="#c62828"
              />
            </Box>
          )}
          {data?.lucro_7dias && data.lucro_7dias.length > 0 && (
            <Box sx={{ width: "100%", mb: 3 }}>
              <DashboardLineChartCard
                label="Lucro 7 dias"
                series={data.lucro_7dias}
                color="#1976d2"
              />
            </Box>
          )}
          {data?.corridas_7dias && data.corridas_7dias.length > 0 && (
            <Box sx={{ width: "100%", mb: 3 }}>
              <DashboardLineChartCard
                label="Corridas 7 dias"
                series={data.corridas_7dias}
                color="#bdb200"
              />
            </Box>
          )}
        </Box>
        {/* O RESTANTE DA DASHBOARD (gráficos, etc) FICA IGUAL */}
      </Box>
    </LoggedLayout>
  );
}
