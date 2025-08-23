import { Configuracao } from "./Configuracao";
import { Assinatura } from "./Assinatura";

export interface UsuarioMeResponse {
  id: string;
  nome_usuario: string;
  email: string;
  nome_completo?: string;
  telefone?: string;
  veiculo?: string;
  address: string;
  address_number: string;
  complement: string;
  postal_code: string;
  province: string;
  city: string;
  cpfcnpj?: string;
  criado_em?: string;
  atualizado_em?: string;
  configuracoes: Configuracao[];
  assinaturas: Assinatura[];
}
