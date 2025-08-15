export interface DashboardResponse {
  ganhos_hoje: number | null;
  ganhos_ontem: number | null;
  ganhos_semana: number | null;
  ganhos_semana_passada: number | null;
  ganhos_mes: number | null;
  ganhos_mes_passado: number | null;

  gastos_hoje: number | null;
  gastos_ontem: number | null;
  gastos_semana: number | null;
  gastos_semana_passada: number | null;
  gastos_mes: number | null;
  gastos_mes_passado: number | null;

  lucro_hoje: number | null;
  lucro_ontem: number | null;
  lucro_semana: number | null;
  lucro_semana_passada: number | null;
  lucro_mes: number | null;
  lucro_mes_passado: number | null;

  corridas_hoje: number | null;
  corridas_ontem: number | null;
  corridas_semana: number | null;
  corridas_semana_passada: number | null;
  corridas_mes: number | null;
  corridas_mes_passado: number | null;

  horas_hoje: number | null;
  horas_ontem: number | null;
  horas_semana: number | null;
  horas_semana_passada: number | null;
  horas_mes: number | null;
  horas_mes_passado: number | null;

  eficiencia: number | null;
  meta_diaria?: number | null;
  meta_semanal?: number | null;
  tendencia_ganhos: number | null;
  tendencia_gastos: number | null;
  tendencia_corridas: number | null;
  ganhos_7dias: number[];
  gastos_7dias: number[];
  lucro_7dias: number[];
  ganhos_mes_array: number[];
  gastos_mes_array: number[];
  lucro_mes_array: number[];
  corridas_7dias: number[];
  corridas_mes_array: number[];
  trend_method: string;
}
