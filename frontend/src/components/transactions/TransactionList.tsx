import { Box, Typography, Paper, Chip } from "@mui/material";
import type { Transaction } from "@/interfaces/Transaction";

interface Props {
  transactions: Transaction[];
}

export default function TransactionList({ transactions }: Props) {
  if (!transactions || transactions.length === 0) {
    return <Typography color="#aaa" sx={{ mt: 4, textAlign: "center" }}>Nenhuma transação encontrada.</Typography>;
  }
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {transactions.map((tx) => (
        <Paper key={tx.id} sx={{ p: 2, bgcolor: "#232733", color: "#fff", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
        </Paper>
      ))}
    </Box>
  );
}
