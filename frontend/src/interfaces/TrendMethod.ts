// Interface para métodos de cálculo de tendência disponíveis no backend
export type TrendMethod =
  | 'media_movel_3'
  | 'media_movel_7'
  | 'media_movel_30'
  | 'media'
  | 'mediana'
  | 'regressao_linear';

export const TREND_METHOD_OPTIONS: TrendMethod[] = [
  'media_movel_3',
  'media_movel_7',
  'media_movel_30',
  'media',
  'mediana',
  'regressao_linear',
];

export const TREND_METHOD_LABELS: Record<TrendMethod, string> = {
  media_movel_3: 'Média móvel dos últimos 3 dias',
  media_movel_7: 'Média móvel dos últimos 7 dias',
  media_movel_30: 'Média móvel dos últimos 30 dias',
  media: 'Média simples',
  mediana: 'Mediana',
  regressao_linear: 'Regressão Linear',
};
