"use client";

import React, { useEffect, useState } from "react";
import type { SessaoComTransacoes } from "@/interfaces/SessaoComTransacoes";

import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, TableContainer, Paper } from "@mui/material";

export default function SessionDetailClient({ sessaoId }: { sessaoId: string }) {
  const [loading, setLoading] = useState(false);
  const [sessao, setSessao] = useState<SessaoComTransacoes | null>(null);

  useEffect(() => {
    if (!sessaoId) return;
    setLoading(true);
    import("axios").then(({ default: axios }) => {
      axios
        .get(`/api/sessao/com-transacoes/${sessaoId}`, { withCredentials: true })
        .then((res) => {
          if (res.data) setSessao(res.data);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, [sessaoId]);

  if (loading) return <Box sx={{ p: 4, textAlign: "center" }}><CircularProgress /></Box>;
  if (!sessao) return <Box sx={{ p: 4 }}><Typography>Não foi possível carregar os detalhes da sessão.</Typography></Box>;

  const { sessao: s, transacoes } = sessao;
  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
        <Typography variant="h6">Sessão {s.id}</Typography>
        <Typography>Início: {new Date(s.inicio).toLocaleString()}</Typography>
        <Typography>Fim: {s.fim ? new Date(s.fim).toLocaleString() : 'Em andamento'}</Typography>
        <Typography>Ganhos: R$ {(s.total_ganhos / 100).toFixed(2)}</Typography>
        <Typography>Gastos: R$ {(s.total_gastos / 100).toFixed(2)}</Typography>
        <Typography>Corridas: {s.total_corridas}</Typography>
        <Typography>Status: {s.eh_ativa ? 'Ativa' : 'Fechada'}</Typography>
      </Box>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>Transações no período:</Typography>
      {transacoes.length === 0 ? (
        <Typography>Nenhuma transação encontrada neste período.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ bgcolor: 'background.paper', boxShadow: 0, borderRadius: 2, maxWidth: '100%' }}>
          <Table sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Descrição</TableCell>
                <TableCell>Categoria</TableCell>
                <TableCell>Valor</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transacoes.map(t => (
                <TableRow key={t.id}>
                  <TableCell>{new Date(t.data).toLocaleString()}</TableCell>
                  <TableCell>{t.descricao}</TableCell>
                  <TableCell>{t.categoria ? `${t.categoria.nome}` : '-'}</TableCell>
                  <TableCell>{((t.valor || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
