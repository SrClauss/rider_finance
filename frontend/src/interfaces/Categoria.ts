export interface Categoria {
  id: string;
  id_usuario: string | null;
  nome: string;
  tipo: string;
  icone?: string | null;
  cor?: string | null;
  eh_padrao: boolean;
  eh_ativa: boolean;
  criado_em: string;
  atualizado_em: string;
}
