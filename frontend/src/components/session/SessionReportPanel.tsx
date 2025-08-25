
"use client";
import React, { useEffect, useState, useRef } from "react";
import { useCategoriaContext } from "@/context/CategoriaContext";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import axios from "axios";

type Stat = {
  total_movimentacoes: number;
  entradas_count: number;
  saidas_count: number;
  total_ganhos: number;
  total_gastos: number;
  net: number;
};

type TransactionItem = {
  id: string;
  valor: number;
  descricao?: string | null;
  data: string | Date;
  tipo?: string | null;
  categoria?: { id?: string; nome?: string; icone?: string; cor?: string } | null;
};

interface SessionReportPanelProps {
  sessaoId: string;
  onClose: () => void;
}

const SessionReportPanel: React.FC<SessionReportPanelProps> = ({ sessaoId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stat | null>(null);
  const [transacoes, setTransacoes] = useState<TransactionItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const { categorias } = useCategoriaContext();

  useEffect(() => {
    if (!sessaoId) return;
    setLoading(true);
    setError(null);
    axios
      .get(`/api/sessao/relatorio/${sessaoId}`, { withCredentials: true })
      .then((r) => {
        if (r.data) {
          setStats(r.data.stats ?? null);
          setTransacoes(r.data.transacoes ?? []);
        } else {
          setError("Sessão não encontrada");
        }
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [sessaoId]);

  return (
    <div
      ref={nodeRef}
      style={{ position: "fixed", left: "50%", bottom: 48, transform: "translateX(-50%)", zIndex: 2000, width: "min(95%,520px)" }}
    >
      <Paper elevation={6} sx={{ p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">Relatório da Sessão</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <Box sx={{ mt: 1 }}>
            {stats ? (
              <Box>
                <Typography variant="body2">Movimentações: {stats.total_movimentacoes}</Typography>
                <Typography variant="body2">Entradas: {stats.entradas_count} • Saídas: {stats.saidas_count}</Typography>
                <Typography variant="body2">Ganhos: R$ {Number(stats.total_ganhos).toFixed(2)}</Typography>
                <Typography variant="body2">Gastos: R$ {Number(stats.total_gastos).toFixed(2)}</Typography>
                <Typography variant="body2">Net: R$ {Number(stats.net).toFixed(2)}</Typography>
              </Box>
            ) : (
              <Typography variant="body2">Nenhuma estatística disponível.</Typography>
            )}

            <Box sx={{ maxHeight: 300, overflow: "auto", mt: 2 }}>
              {transacoes.map((t) => {
                const catFromCtx = categorias.find((c) => c.id === (t.categoria && t.categoria.id));
                const cor = catFromCtx?.cor ?? t.categoria?.cor ?? "#999";
                const icone = catFromCtx?.icone ?? t.categoria?.icone ?? "fas fa-question";
                return (
                  <Box key={t.id} sx={{ display: "flex", justifyContent: "space-between", py: 1, borderBottom: "1px solid #eee", alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 40, backgroundColor: cor, borderRadius: 1 }} />
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <i className={icone} style={{ width: 20, textAlign: 'center' }} aria-hidden />
                          <Typography variant="body2">{t.descricao ?? "—"}</Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">{new Date(t.data).toLocaleString()}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="body2" sx={{ color: t.tipo === "receita" || t.tipo === 'entrada' ? "#2BD34F" : "#FF3B30" }}>R$ {Number(t.valor).toFixed(2)}</Typography>
                      <Typography variant="caption">{t.categoria?.nome ?? "—"}</Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Paper>
    </div>
  );
};

export default SessionReportPanel;
