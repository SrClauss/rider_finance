import { Box, Typography, Paper, Chip } from "@mui/material";
import type { SessaoComTransacoes } from "@/interfaces/SessaoComTransacoes";
import '@fortawesome/fontawesome-free/css/all.css';

interface Props {
  transactions: SessaoComTransacoes["transacoes"];
}

export default function TransactionListCompact({ transactions }: Props) {
  if (!transactions || transactions.length === 0) {
    return <Typography color="#aaa" sx={{ mt: 4, textAlign: "center" }}>Nenhuma transação encontrada.</Typography>;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {transactions.map((tx) => {
        const isEntrada = tx.tipo === 'entrada';
        return (
          <Paper key={tx.id} sx={{ p: 1.2, bgcolor: "#232733", color: "#fff", borderRadius: 2, display: "flex", alignItems: "center", gap: 1, minHeight: 48 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontWeight={600} sx={{ fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.descricao || "Sem descrição"}</Typography>
              <Typography variant="body2" color="#aaa" sx={{ fontSize: 12 }}>{new Date(tx.data).toLocaleDateString("pt-BR")}</Typography>
            </Box>
            <Chip label={isEntrada ? "Receita" : "Despesa"} color={isEntrada ? "success" : "error"} size="small" sx={{ fontWeight: 700, fontSize: 12 }} />
            <Typography fontWeight={700} color={isEntrada ? "#00e676" : "#ff1744"} sx={{ fontSize: 15, minWidth: 90, textAlign: 'right' }}>
              {(tx.valor / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </Typography>
            {tx.categoria?.icone && (
              <i className={`fa-solid ${tx.categoria.icone}`} style={{ fontSize: 20, marginLeft: 10, color: '#fff' }} title={tx.categoria.nome}></i>
            )}
          </Paper>
        );
      })}
    </Box>
  );
}
