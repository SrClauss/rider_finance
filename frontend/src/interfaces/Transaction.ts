export interface Transaction {
  id: string;
  id_usuario: string;
  id_categoria: string;
  valor: number;
  tipo: string; // "entrada" | "saida"
  descricao?: string;
  data: string; // ISO
}
