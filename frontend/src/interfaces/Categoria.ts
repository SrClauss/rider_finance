export interface Categoria {
  id: string;
  id_usuario: string | null;
  nome: string;
  tipo: string;
  icone?: string | null;
  cor?: string | null;
  criado_em: string;
  atualizado_em: string;
}
