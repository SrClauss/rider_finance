"use client";
import React, { useEffect, useState } from "react";
import LoggedLayout from "@/layouts/LoggedLayout";
import axios from "axios";
import { Box, List, ListItem, ListItemText, Chip, Typography, CircularProgress, Button, ListItemButton } from "@mui/material";
import { useRouter } from "next/navigation";

type Sessao = {
  id: string;
  inicio?: string;
  fim?: string | null;
  eh_ativa?: boolean;
  total_corridas?: number;
  total_ganhos?: number;
  total_gastos?: number;
};

type PaginatedSessoes = {
  total: number;
  page: number;
  page_size: number;
  items: Sessao[];
};

export default function SessionsPage() {
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    axios
      .get('/api/me', { withCredentials: true })
      .then((meRes) => {
        const id = meRes?.data?.id;
        if (!id) return;
        return axios.get(`/api/sessao/list/${id}?page=${page}&page_size=${pageSize}`, { withCredentials: true });
      })
      .then((res) => {
        if (!mounted) return;
        if (res && res.data && Array.isArray(res.data.items)) {
          setSessoes(res.data.items as Sessao[]);
          setTotal(res.data.total || 0);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false };
  }, [page, pageSize]);

  return (
    <LoggedLayout>
      <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5">Sessões</Typography>
        <Button variant="contained" onClick={() => router.push("/")}>Voltar</Button>
      </Box>
      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <List>
            {sessoes.length === 0 && <Typography>Nenhuma sessão encontrada.</Typography>}
            {sessoes.map((s) => (
              <ListItem key={s.id} disablePadding>
                <ListItemButton onClick={() => router.push(`/sessoes/${s.id}`)}>
                  <ListItemText
                    primary={`Início: ${s.inicio ?? "-"}`}
                    secondary={`Ganhos: R$ ${((s.total_ganhos || 0)).toFixed(2)} • Gastos: R$ ${((s.total_gastos || 0)).toFixed(2)}`}
                  />
                  {s.eh_ativa ? <Chip label="Ativa" color="secondary" /> : <Chip label="Fechada" />}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              sx={{ mr: 1 }}
            >
              Anterior
            </Button>
            <Typography sx={{ mt: 1 }}>{page} / {Math.ceil(total / pageSize) || 1}</Typography>
            <Button
              variant="outlined"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(total / pageSize)}
              sx={{ ml: 1 }}
            >
              Próxima
            </Button>
          </Box>
        </>
      )}
      </Box>
    </LoggedLayout>
  );
}
