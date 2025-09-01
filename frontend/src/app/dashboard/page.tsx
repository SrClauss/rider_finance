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

      <div>dida</div>
 
    </LoggedLayout>
  );
}
