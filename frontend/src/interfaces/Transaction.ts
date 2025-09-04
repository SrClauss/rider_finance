export interface Transaction {
  id: string;
  id_usuario: string;
  id_categoria: string;
  valor: number;
  eventos?: number;
  tipo: string; // "entrada" | "saida"
  descricao?: string;
  data: string; // ISO
}
