export interface Configuracao {
  id: string;
  id_usuario?: string;
  chave: string;
  valor?: string;
  categoria?: string;
  descricao?: string;
  tipo_dado?: string;
  eh_publica: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface Assinatura {
  id: string;
  usuario_id: string;
  status: string;
  tipo: string;
  criado_em: string;
  atualizado_em: string;
}
