import { Box, Typography, Paper, Chip, IconButton, Divider } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Transaction } from "@/interfaces/Transaction";
import { useCategoriaContext } from "@/context/CategoriaContext";


interface Props {
  transactions: Transaction[];
  onEdit?: (tx: Transaction) => void;
  onDelete?: (id: string) => void;
}


export default function TransactionList({ transactions, onEdit, onDelete }: Props) {
  const { categorias } = useCategoriaContext();

  if (!transactions || transactions.length === 0) {
    return <Typography color="#aaa" sx={{ mt: 4, textAlign: "center" }}>Nenhuma transação encontrada.</Typography>;
  }


  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {transactions.map((tx) => (
        <Paper key={tx.id} sx={{ p: 1.5, bgcolor: "#232733", color: "#fff", borderRadius: 2, display: "flex", flexDirection: "column", gap: 0.5 }}>
          {/* Linha 1: Descrição */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1rem' }}>{tx.descricao || "Sem descrição"}</Typography>
            <Divider sx={{ flexGrow: 1, ml: 2, borderColor: '#fff', opacity: 0.3 }} />
          </Box>
          
          {/* Linha 2: Data/hora à esquerda, Receita/Despesa e Valor à direita */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="#aaa">{new Date(tx.data).toLocaleString("pt-BR")}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label={tx.tipo === "entrada" ? "Receita" : "Despesa"} color={tx.tipo === "entrada" ? "success" : "error"} size="small" />
              <Typography variant="body1" fontWeight={700} color={tx.tipo === "entrada" ? "#00e676" : "#ff1744"}>
                {(tx.valor / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </Typography>
            </Box>
          </Box>
          
          {/* Linha 3: Ícone à esquerda */}
          {/* Botões */}
          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', mt: 0.5 }}>
            {(() => {
              const categoria = categorias.find(c => c.id === tx.id_categoria);
              if (!categoria?.icone) return null;
              const ic = categoria.icone || '';
              const isCustom = ic.startsWith('icon-');
              const isFaLike = ic.includes('fa-');
              const className = isCustom ? ic : (isFaLike ? ic : `fa-solid ${ic}`);
              return <i className={className} style={{ color: categoria.cor || "#fff", fontSize: 24 }} />;
            })()}
            <Divider sx={{ flexGrow: 1, mx: 1, borderColor: '#fff', opacity: 0.3 }} />
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton size="small" color="success" aria-label="Editar transação" onClick={() => onEdit && onEdit(tx)}>
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" color="error" aria-label="Deletar transação" onClick={() => onDelete && onDelete(tx.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      ))}
    </Box>
  );
}
