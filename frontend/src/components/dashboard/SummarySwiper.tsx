import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import SummaryTodayCard from "./SummaryTodayCard";
import SummaryWeeklyCard from "./SummaryWeeklyCard";
import SummaryMonthlyCard from "./SummaryMonthlyCard";
import SummaryLast7DaysCard from "./SummaryLast7DaysCard";
import SummaryLast30DaysCard from "./SummaryLast30DaysCard";
import { DashboardResponse } from "@/interfaces/DashboardResponse";

export default function SummarySwiper({ data }: { data: DashboardResponse }) {
  return (
    <Swiper spaceBetween={50} slidesPerView={1}>
      <SwiperSlide>
        <SummaryTodayCard
          ganhos_hoje={data.ganhos_hoje}
          gastos_hoje={data.gastos_hoje}
          corridas_hoje={data.corridas_hoje}
          horas_hoje={data.horas_hoje}
          lucro_hoje={data.lucro_hoje}
          ganhos_ontem={data.ganhos_ontem}
          gastos_ontem={data.gastos_ontem}
          corridas_ontem={data.corridas_ontem}
          horas_ontem={data.horas_ontem}
        />
      </SwiperSlide>
      <SwiperSlide>
        <SummaryWeeklyCard
          ganhos_semana={data.ganhos_semana}
          gastos_semana={data.gastos_semana}
          corridas_semana={data.corridas_semana}
          horas_semana={data.horas_semana}
          lucro_semana={data.lucro_semana}
        />
      </SwiperSlide>
      
      <SwiperSlide>
        <SummaryMonthlyCard
          ganhos_mes={data.ganhos_mes}
          gastos_mes={data.gastos_mes}
          corridas_mes={data.corridas_mes}
          horas_mes={data.horas_mes}
          lucro_mes={data.lucro_mes}
        />
      </SwiperSlide>
      <SwiperSlide>
        <SummaryLast7DaysCard
          ganhos_7dias={data.ganhos_7dias}
          gastos_7dias={data.gastos_7dias}
          corridas_7dias={data.corridas_7dias}
          horas_7dias={data.horas_7dias}
          ganhos_semana_passada={data.ganhos_semana_passada}
          gastos_semana_passada={data.gastos_semana_passada}
          corridas_semana_passada={data.corridas_semana_passada}
          horas_semana_passada={data.horas_semana_passada}
        />
      </SwiperSlide>
      <SwiperSlide>
        <SummaryLast30DaysCard
          ganhos_30dias={data.ganhos_30dias}
          gastos_30dias={data.gastos_30dias}
          corridas_30dias={data.corridas_30dias}
          horas_30dias={data.horas_30dias}
          ganhos_mes_passado={data.ganhos_mes_passado}
          gastos_mes_passado={data.gastos_mes_passado}
          corridas_mes_passado={data.corridas_mes_passado}
          horas_mes_passado={data.horas_mes_passado}
        />
      </SwiperSlide>
    </Swiper>
  );
}
