
export interface Goal {
  id: string;
  id_usuario: string;
  titulo: string;
  descricao?: string;
  tipo: string;
  categoria: string;
  valor_alvo: number;
  valor_atual: number;
  unidade?: string;
  data_inicio: string;
  data_fim?: string;
  eh_ativa: boolean;
  eh_concluida: boolean;
  concluida_em?: string;
  lembrete_ativo: boolean;
  frequencia_lembrete?: string;
  criado_em: string;
  atualizado_em: string;
}


export interface GoalPayload {
  titulo: string;
  descricao?: string;
  tipo: string;
  categoria: string;
  valor_alvo: number;
  valor_atual: number;
  unidade?: string;
  data_inicio: string;
  data_fim?: string;
  eh_ativa: boolean;
  eh_concluida: boolean;
  concluida_em?: string;
  lembrete_ativo: boolean;
  frequencia_lembrete?: string;
}
