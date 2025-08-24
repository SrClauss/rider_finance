export interface Assinatura {
  id: string;
  usuario_id: string;
  status: string;
  tipo: string;
  criado_em: string;
  atualizado_em: string;
  periodo_inicio?: string;
  periodo_fim?: string;
  asaas_subscription_id?: string;
  valor_assinatura?: string;
}
