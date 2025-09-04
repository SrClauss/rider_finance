export interface Transacao {
  id: string;
  id_usuario: string;
  id_categoria: string;
  valor: number;
  eventos?: number;
  descricao?: string;
  tipo: string;
  data: string; // ISO string
  origem?: string;
  id_externo?: string;
  plataforma?: string;
  observacoes?: string;
  tags?: string;
  criado_em: string; // ISO string
  atualizado_em: string; // ISO string
}
