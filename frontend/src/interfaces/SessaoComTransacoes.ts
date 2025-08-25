export interface SessaoComTransacoes {
  sessao: {
    id: string;
    id_usuario: string;
    inicio: string;
    fim?: string | null;
    total_minutos?: number | null;
    local_inicio?: string | null;
    local_fim?: string | null;
    total_corridas: number;
    total_ganhos: number;
    total_gastos: number;
    plataforma?: string | null;
    observacoes?: string | null;
    clima?: string | null;
    eh_ativa: boolean;
    criado_em: string;
    atualizado_em: string;
  };
  transacoes: Array<{
    id: string;
    valor: number;
    descricao?: string;
    data: string;
    categoria?: {
      id: string;
      nome: string;
      icone?: string | null;
    } | null;
  }>;
}
