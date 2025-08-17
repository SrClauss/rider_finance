import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, MenuItem, CircularProgress, Alert } from "@mui/material";
import { useState, useEffect } from "react";
import axios from "axios";

import { Goal, GoalPayload } from "@/interfaces/goal";

type GoalModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  goal?: Goal | null;
};

export default function GoalModal(props: GoalModalProps) {
  const { open, onClose, onSaved, goal } = props;
  const [form, setForm] = useState<GoalPayload>({
    titulo: "",
    descricao: "",
    valor_meta: 0,
    valor_atual: 0,
    data_limite: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && goal) {
      setForm({
        titulo: goal.titulo || "",
        descricao: goal.descricao || "",
        valor_meta: goal.valor_meta || 0,
        valor_atual: goal.valor_atual || 0,
        data_limite: goal.data_limite ? goal.data_limite.slice(0, 10) : ""
      });
    } else if (open) {
  setForm({ titulo: "", descricao: "", valor_meta: 0, valor_atual: 0, data_limite: "" });
    }
  }, [open, goal]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "valor_meta" || name === "valor_atual" ? Number(value) : value
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      // Monta payload compatível com o backend Rust
      const now = new Date();
      const data_inicio = now.toISOString().slice(0, 19); // formato yyyy-mm-ddThh:mm:ss
      const payload = {
        titulo: form.titulo,
        descricao: form.descricao || null,
        tipo: "financeira", // valor fixo ou pode virar campo no futuro
        categoria: "geral", // valor fixo ou pode virar campo no futuro
        valor_alvo: form.valor_meta,
        valor_atual: form.valor_atual,
        unidade: null,
        data_inicio: data_inicio,
        data_fim: form.data_limite ? form.data_limite + "T00:00:00" : null,
        eh_ativa: true,
        eh_concluida: false,
        concluida_em: null,
        lembrete_ativo: false,
        frequencia_lembrete: null
      };
      if (goal && goal.id) {
        await axios.put(`/api/meta/${goal.id}`, payload);
      } else {
        await axios.post(`/api/meta`, payload);
      }
      onSaved();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Erro ao salvar meta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{goal ? "Editar Meta" : "Nova Meta"}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Título"
            name="titulo"
            value={form.titulo}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            label="Descrição"
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Valor da Meta"
            name="valor_meta"
            type="number"
            value={form.valor_meta}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            label="Valor Atual"
            name="valor_atual"
            type="number"
            value={form.valor_atual}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Data Limite"
            name="data_limite"
            type="date"
            value={form.data_limite}
            onChange={handleChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
