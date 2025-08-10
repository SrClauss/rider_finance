export interface UsuarioRegisterPayload {
  nome_usuario: string;
  email: string;
  senha: string;
  nome_completo?: string;
  telefone?: string;
  veiculo?: string;
  // removido data_inicio_atividade
  address: string;
  address_number: string;
  complement: string;
  postal_code: string;
  province: string;
  city: string;
  captcha_token: string;
  captcha_answer: string;
}
