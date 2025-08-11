export interface DashboardResponse {
  ganhos_hoje: number;
  gastos_hoje: number;
  lucro_hoje: number;
  corridas_hoje: number;
  horas_hoje: number;
  eficiencia: number;
  ganhos_semana: number;
  gastos_semana: number;
  lucro_semana: number;
  corridas_semana: number;
  horas_semana: number;
  meta_diaria?: number;
  meta_semanal?: number;
  tendencia_ganhos: number;
  tendencia_gastos: number;
  tendencia_corridas: number;
  ganhos_7dias: number[];
  gastos_7dias: number[];
  lucro_7dias: number[];
  ganhos_mes: number[];
  gastos_mes: number[];
  lucro_mes: number[];
}
