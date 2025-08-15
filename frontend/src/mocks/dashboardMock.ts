// Dados mockados para DashboardResponse
// Simula uma semana e mês de ganhos, gastos e lucros reais

const dashboardMock = {
  ganhos_hoje: 180,
  ganhos_ontem: 160,
  ganhos_semana: 1250,
  ganhos_semana_passada: 1100,
  ganhos_mes: 5400,
  ganhos_mes_passado: 5200,

  gastos_hoje: 65,
  gastos_ontem: 70,
  gastos_semana: 480,
  gastos_semana_passada: 510,
  gastos_mes: 2100,
  gastos_mes_passado: 2050,

  lucro_hoje: 115,
  lucro_ontem: 90,
  lucro_semana: 770,
  lucro_semana_passada: 590,
  lucro_mes: 3300,
  lucro_mes_passado: 3150,

  corridas_hoje: 10,
  corridas_ontem: 8,
  corridas_semana: 68,
  corridas_semana_passada: 60,
  corridas_mes: 280,
  corridas_mes_passado: 265,

  horas_hoje: 6,
  horas_ontem: 5,
  horas_semana: 42,
  horas_semana_passada: 38,
  horas_mes: 180,
  horas_mes_passado: 170,

  eficiencia: 94,
  meta_diaria: 200,
  meta_semanal: 1400,
  tendencia_ganhos: 12,
  tendencia_gastos: -7,
  tendencia_corridas: 3,
  ganhos_7dias: [180, 160, 170, 200, 210, 180, 150],
  gastos_7dias: [65, 70, 60, 80, 75, 65, 65],
  lucro_7dias: [115, 90, 110, 120, 135, 115, 85],
  ganhos_mes_array: [180, 160, 170, 200, 210, 180, 150, 190, 175, 160, 185, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300, 310, 320, 330, 340, 350, 360, 370, 380, 390],
  gastos_mes_array: [65, 70, 60, 80, 75, 65, 65, 70, 68, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98, 100, 102, 104, 106, 108, 110, 112, 114],
  lucro_mes_array: [115, 90, 110, 120, 135, 115, 85, 120, 107, 88, 111, 124, 132, 140, 148, 156, 164, 172, 180, 188, 196, 204, 212, 220, 228, 236, 244, 252, 260, 268, 276],
  corridas_7dias: [10, 8, 9, 12, 11, 10, 7],
  corridas_mes_array: [10, 8, 9, 12, 11, 10, 7, 13, 12, 11, 14, 15, 13, 12, 11, 10, 9, 8, 10, 11, 12, 13, 14, 15, 13, 12, 11, 10, 9, 8, 7],
  trend_method: "media_movel_30"
};

export default dashboardMock;
