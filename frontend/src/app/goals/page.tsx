"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Button, CircularProgress, Alert, Pagination, TextField, MenuItem, Drawer, IconButton, Stack, Card, CardContent, LinearProgress } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import LoggedLayout from "@/layouts/LoggedLayout";
import ConfirmDeleteModal from "@/modals/ConfirmDeleteModal";
import GoalModal from "../../modals/GoalModal";

import axios from "axios";
import { Goal } from "@/interfaces/goal";

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);

  const fetchGoals = async () => {
    setLoading(true);
    setError(null);
    try {
      try {
        const res = await axios.get("/api/meta/a_cumprir", { withCredentials: true });
        if (Array.isArray(res.data)) {
          setGoals(res.data.map(goal => ({
            ...goal,
            valor_alvo: parseInt(goal.valor_alvo, 10) || 0,
            valor_atual: parseInt(goal.valor_atual, 10) || 0,
            data_inicio: goal.data_inicio ? String(goal.data_inicio) : "",
            data_fim: goal.data_fim ? String(goal.data_fim) : "",
            descricao: goal.descricao ?? "",
            tipo: goal.tipo ?? "",
            categoria: goal.categoria ?? "",
            unidade: goal.unidade ?? "",
            concluida_em: goal.concluida_em ?? "",
            frequencia_lembrete: goal.frequencia_lembrete ?? "",
          })));
        } else {
          setGoals([]);
        }
      } catch (err: any) {
        let msg = "Erro ao buscar metas";
        if (err?.response?.data?.message) msg += ": " + err.response.data.message;
        else if (err?.message) msg += ": " + err.message;
        setError(msg);
        setGoals([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleAdd = () => {
    setEditGoal(null);
    setModalOpen(true);
  };
  const handleEdit = (goal: Goal) => {
    setEditGoal(goal);
    setModalOpen(true);
  };
  const handleDeleteClick = (id: string) => {
    setSelectedDeleteId(id);
    setDeleteModalOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (!selectedDeleteId) return;
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`/api/meta/${selectedDeleteId}`);
      setDeleteModalOpen(false);
      setSelectedDeleteId(null);
      await fetchGoals();
    } catch {
      setError("Erro ao deletar meta");
    } finally {
      setLoading(false);
    }
  };
  const handleModalClose = () => {
    setModalOpen(false);
    setEditGoal(null);
  };
  const handleGoalSaved = async () => {
    setModalOpen(false);
    setEditGoal(null);
    await fetchGoals();
  };

  return (
    <LoggedLayout>
      <Box sx={{ maxWidth: 900, mx: "auto", p: { xs: 2, md: 4 } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h4" fontWeight={700} color="#fff">
            Metas
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Nova Meta
          </Button>
        </Box>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : goals.length === 0 ? (
          <Typography color="#aaa" sx={{ mt: 4, textAlign: "center" }}>Nenhuma meta cadastrada.</Typography>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            {goals.map(goal => {
              const progress = goal.valor_alvo > 0 ? (goal.valor_atual / goal.valor_alvo) * 100 : 0;
              return (
                <Card key={goal.id} sx={{ bgcolor: "#232733", color: "#fff", borderRadius: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" fontWeight={700}>{goal.titulo}</Typography>
                      <Button size="small" color="primary" onClick={() => handleEdit(goal)}>Editar</Button>
                      <Button size="small" color="error" onClick={() => handleDeleteClick(goal.id)}>Excluir</Button>
                    </Box>
                    <Typography variant="body2" color="#bbb" sx={{ mb: 1 }}>{goal.descricao}</Typography>
                    <Typography variant="body2" color="#bbb">Meta: R$ {(goal.valor_alvo ?? 0).toLocaleString("pt-BR")}</Typography>
                    <Typography variant="body2" color="#bbb">Atual: R$ {(goal.valor_atual ?? 0).toLocaleString("pt-BR")}</Typography>
                    <Typography variant="body2" color="#bbb">Início: {goal.data_inicio ? new Date(goal.data_inicio).toLocaleDateString("pt-BR") : '-'}</Typography>
                    <Typography variant="body2" color="#bbb">Limite: {goal.data_fim ? new Date(goal.data_fim).toLocaleDateString("pt-BR") : '-'}</Typography>
                    <Box sx={{ mt: 2 }}>
                      <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 5, bgcolor: '#444', '& .MuiLinearProgress-bar': { bgcolor: progress >= 100 ? '#00e676' : '#1976d2' } }} />
                      <Typography variant="caption" color="#bbb">Progresso: {progress.toFixed(1)}%</Typography>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
  <GoalModal open={modalOpen} onClose={handleModalClose} onSaved={handleGoalSaved} goal={editGoal} />
        <ConfirmDeleteModal
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Confirmar exclusão"
          description="Tem certeza que deseja deletar esta meta? Esta ação não pode ser desfeita."
        />
      </Box>
    </LoggedLayout>
  );
}
