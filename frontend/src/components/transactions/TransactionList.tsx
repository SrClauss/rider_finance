import { Box, Typography, Paper, Chip, IconButton, Divider } from "@mui/material";
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import type { Transaction } from "@/interfaces/Transaction";


interface Props {
  transactions: Transaction[];
  onEdit?: (tx: Transaction) => void;
  onDelete?: (id: string) => void;
}


export default function TransactionList({ transactions, onEdit, onDelete }: Props) {
  if (!transactions || transactions.length === 0) {
    return <Typography color="#aaa" sx={{ mt: 4, textAlign: "center" }}>Nenhuma transação encontrada.</Typography>;
  }


  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {transactions.map((tx) => (
        <Paper key={tx.id} sx={{ p: 2, bgcolor: "#232733", color: "#fff", borderRadius: 2, display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography fontWeight={700}>{tx.descricao || "Sem descrição"}</Typography>
              <Typography variant="body2" color="#aaa">{new Date(tx.data).toLocaleDateString("pt-BR")}</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Chip label={tx.tipo === "entrada" ? "Receita" : "Despesa"} color={tx.tipo === "entrada" ? "success" : "error"} size="small" />
              <Typography fontWeight={700} color={tx.tipo === "entrada" ? "#00e676" : "#ff1744"}>
                {tx.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 1 }}>
            <Divider sx={{ flexGrow: 1, mr: 2, borderColor: '#fff', opacity: 0.3 }} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton size="small" color="primary" sx={{ opacity: 0.7 }} aria-label="Editar transação" onClick={() => onEdit && onEdit(tx)}>
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" color="error" sx={{ opacity: 0.7 }} aria-label="Deletar transação" onClick={() => onDelete && onDelete(tx.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      ))}
    </Box>
  );
}
