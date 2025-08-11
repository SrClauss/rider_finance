export interface UsuarioRegisterPayload {
  id?: string;
  nome_usuario: string;
  email: string;
  senha?: string;
  nome_completo?: string;
  telefone?: string;
  veiculo?: string;
  data_inicio_atividade?: string;
  eh_pago?: boolean;
  id_pagamento?: string;
  metodo_pagamento?: string;
  status_pagamento?: string;
  tipo_assinatura?: string;
  trial_termina_em?: string;
  criado_em?: string;
  atualizado_em?: string;
  ultima_tentativa_redefinicao?: string;
  address: string;
  address_number: string;
  complement: string;
  postal_code: string;
  province: string;
  city: string;
  cpfcnpj?: string;
  captcha_token?: string;
  captcha_answer?: string;
}
