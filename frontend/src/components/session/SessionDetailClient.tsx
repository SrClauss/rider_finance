"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress } from "@mui/material";

type Transaction = {
  id: string;
  valor: number;
  tipo?: string;
  data?: string;
  descricao?: string;
};

export default function SessionDetailClient({ sessaoId }: { sessaoId: string }) {
  const [loading, setLoading] = useState(false);
  const [transacoes, setTransacoes] = useState<Transaction[]>([]);
  const [totals, setTotals] = useState({ ganhos: 0, gastos: 0, corridas: 0 });

  useEffect(() => {
    if (!sessaoId) return;
    setLoading(true);
    axios
      .get(`/api/sessao/com-transacoes/${sessaoId}`, { withCredentials: true })
      .then((res) => {
        const data = res.data;
        if (data) {
          const txs: Transaction[] = Array.isArray(data.transacoes) ? data.transacoes : Array.isArray(data) ? data : [];
          setTransacoes(txs);
          const ganhos = txs.reduce((s, t) => s + (t.tipo !== 'saida' ? (t.valor || 0) : 0), 0);
          const gastos = txs.reduce((s, t) => s + (t.tipo === 'saida' ? (t.valor || 0) : 0), 0);
          setTotals({ ganhos, gastos, corridas: txs.length });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessaoId]);

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Sessão {sessaoId}</Typography>
        <Typography>Ganhos: R$ {totals.ganhos.toFixed(2)}</Typography>
        <Typography>Gastos: R$ {totals.gastos.toFixed(2)}</Typography>
        <Typography>Corridas: {totals.corridas}</Typography>
      </Box>
      {loading ? <CircularProgress /> : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell>Valor</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transacoes.map(t => (
              <TableRow key={t.id}>
                <TableCell>{t.data}</TableCell>
                <TableCell>{t.descricao}</TableCell>
                <TableCell>{(t.valor || 0).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}
