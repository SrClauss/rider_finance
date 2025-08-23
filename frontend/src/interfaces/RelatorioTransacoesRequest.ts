export interface TransacaoFiltro {
  id_categoria?: string | null;
  descricao?: string | null;
  tipo?: string | null;
  data_inicio?: string | null; // ISO string
  data_fim?: string | null; // ISO string
}

export interface RelatorioTransacoesRequest {
  tipo_arquivo: 'pdf' | 'xlsx';
  filtros: TransacaoFiltro;
}
