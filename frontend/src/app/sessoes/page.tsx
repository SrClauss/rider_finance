"use client";
import React, { useEffect, useState } from "react";
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

export default function SessionsPage() {
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    axios
      .get('/api/me', { withCredentials: true })
      .then((meRes) => {
        const id = meRes?.data?.id;
        if (!id) return;
        return axios.get(`/api/sessao/list/${id}`, { withCredentials: true });
      })
      .then((res) => {
        if (!mounted) return;
        if (res && Array.isArray(res.data)) setSessoes(res.data as Sessao[]);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false };
  }, []);

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5">Sessões</Typography>
        <Button variant="contained" onClick={() => router.push("/")}>Voltar</Button>
      </Box>
      {loading ? (
        <CircularProgress />
      ) : (
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
      )}
    </Box>
  );
}
