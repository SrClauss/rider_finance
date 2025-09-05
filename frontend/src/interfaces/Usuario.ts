export interface Usuario {
  id: string;
  nome_usuario: string;
  email: string;
  // senha não deve ser exposta, opcional no payload de criação
  senha?: string;
  nome_completo: string;
  telefone: string;
  veiculo: string;
  blocked: boolean;
  blocked_date?: string | null;
  criado_em: string;
  atualizado_em: string;
  ultima_tentativa_redefinicao: string;
  address: string;
  address_number: string;
  complement: string;
  postal_code: string;
  province: string;
  city: string;
  cpfcnpj: string;
  // data de expiração da assinatura, pode ser null se não tiver assinatura
  subscription_end?: string | null;
  // dados opcionais da assinatura (quando disponíveis)
  assinatura?: {
    asaas_subscription_id?: string;
    periodo_inicio?: string;
    periodo_fim?: string;
  } | null;
}

// Uma versão simplificada usada pelo admin list
export interface UsuarioListItem {
  id: string;
  nome: string; // nome_completo
  usuario: string; // nome_usuario
  email?: string;
  cpf?: string;
  subscription_end?: string | null;
  blocked?: boolean;
  blocked_date?: string | null;
}
