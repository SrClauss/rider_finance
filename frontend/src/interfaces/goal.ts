
export interface Goal {
  id: string;
  id_usuario: string;
  titulo: string;
  descricao?: string | null;
  tipo: string;
  categoria: string;
  valor_alvo: number;
  valor_atual: number;
  unidade?: string | null;
  data_inicio: string;
  data_fim?: string | null;
  eh_ativa: boolean;
  eh_concluida: boolean;
  concluida_em?: string | null;
  criado_em: string;
  atualizado_em: string;
  concluida_com?: number | null;
}


export interface GoalPayload {
  titulo: string;
  descricao?: string | null;
  tipo: string;
  categoria: string;
  valor_alvo: number;
  valor_atual: number;
  unidade?: string | null;
  data_inicio: string;
  data_fim?: string | null;
  eh_ativa: boolean;
  eh_concluida: boolean;
  concluida_em?: string | null;
  concluida_com?: number | null;
}
