import { Box, Typography, Paper } from "@mui/material";
import type { SessaoComTransacoes } from "@/interfaces/SessaoComTransacoes";

interface Props {
  transacoes: SessaoComTransacoes["transacoes"];
}

export default function SessionResumo({ transacoes }: Props) {
  const receitas = transacoes.filter(t => t.tipo === 'entrada');
  const despesas = transacoes.filter(t => t.tipo === 'saida');
  const totalReceitas = receitas.reduce((acc, t) => acc + t.valor, 0);
  const totalDespesas = despesas.reduce((acc, t) => acc + t.valor, 0);
  const saldo = totalReceitas - totalDespesas;
  const qtdEntradas = receitas.length;
  const qtdSaidas = despesas.length;

  return (
    <Paper sx={{ mt: 4, p: 3, bgcolor: '#181c2b', color: '#fff', borderRadius: 3, boxShadow: '0 2px 12px 0 rgba(0,0,0,0.10)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Conciliação da Sessão</Typography>
      <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
        <ResumoItem label="Receitas" value={totalReceitas} color="#00e676" />
        <ResumoItem label="Despesas" value={totalDespesas} color="#ff1744" />
        <ResumoItem label="Saldo" value={saldo} color={saldo >= 0 ? '#00e676' : '#ff1744'} destaque />
        <ResumoItem label="Qtd. Entradas" value={qtdEntradas} color="#00e676" inteiro />
        <ResumoItem label="Qtd. Saídas" value={qtdSaidas} color="#ff1744" inteiro />
      </Box>
    </Paper>
  );
}

function ResumoItem({ label, value, color, destaque, inteiro }: { label: string, value: number, color: string, destaque?: boolean, inteiro?: boolean }) {
  return (
    <Box sx={{ minWidth: 120, textAlign: 'center', p: destaque ? 2 : 1, borderRadius: 2, bgcolor: destaque ? 'rgba(0,230,118,0.08)' : 'transparent', border: destaque ? `2px solid ${color}` : undefined }}>
      <Typography sx={{ fontWeight: 600, color, fontSize: destaque ? 22 : 16 }}>{inteiro ? value : (value / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Typography>
      <Typography sx={{ fontSize: 13, color: '#aaa', fontWeight: 500 }}>{label}</Typography>
    </Box>
  );
}
