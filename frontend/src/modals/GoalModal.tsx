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
  const [form, setForm] = useState<any>({
    titulo: "",
    descricao: "",
    tipo: "faturamento",
    categoria: "geral",
    valor_alvo: 0,
    valor_atual: 0,
    unidade: "",
    data_inicio: new Date().toISOString().slice(0, 10),
    data_fim: "",
    eh_ativa: true,
    eh_concluida: false,
    lembrete_ativo: false,
    criado_em: "",
    atualizado_em: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && goal) {
      setForm({
        titulo: goal.titulo || "",
        descricao: goal.descricao || "",
        tipo: goal.tipo || "faturamento",
        categoria: goal.categoria || "geral",
        valor_alvo: goal.valor_alvo || 0,
        valor_atual: goal.valor_atual || 0,
        unidade: goal.unidade || "",
        data_inicio: goal.data_inicio ? goal.data_inicio.slice(0, 10) : new Date().toISOString().slice(0, 10),
        data_fim: goal.data_fim ? goal.data_fim.slice(0, 10) : "",
        eh_ativa: goal.eh_ativa ?? true,
        eh_concluida: goal.eh_concluida ?? false,
        criado_em: goal.criado_em || "",
        atualizado_em: goal.atualizado_em || ""
      });
    } else if (open) {
      setForm({
        titulo: "",
        descricao: "",
        tipo: "faturamento",
        categoria: "geral",
        valor_alvo: 0,
        valor_atual: 0,
        unidade: "",
        data_inicio: new Date().toISOString().slice(0, 10),
        data_fim: "",
        eh_ativa: true,
        eh_concluida: false,
        lembrete_ativo: false,
        criado_em: "",
        atualizado_em: ""
      });
    }
  }, [open, goal]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({
      ...prev,
      [name]: name === "valor_alvo" || name === "valor_atual" ? Number(value) : value
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      // Monta payload compatível com o backend Rust
      const now = new Date();
      const data_inicio = form.data_inicio ? form.data_inicio + "T00:00:00" : now.toISOString().slice(0, 19);
      const payload = {
        titulo: form.titulo,
        descricao: form.descricao || null,
        tipo: form.tipo,
        categoria: form.categoria,
        valor_alvo: form.valor_alvo,
        valor_atual: form.valor_atual,
        unidade: form.unidade || null,
        data_inicio: data_inicio,
        data_fim: form.data_fim ? form.data_fim + "T00:00:00" : null,
        eh_ativa: form.eh_ativa,
        eh_concluida: form.eh_concluida,
        concluida_em: form.concluida_em || null,
        concluida_com: form.concluida_com ?? null
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
            name="valor_alvo"
            type="number"
            value={form.valor_alvo}
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
            select
            label="Tipo"
            name="tipo"
            value={form.tipo}
            onChange={handleChange}
            fullWidth
            margin="normal"
          >
            <MenuItem value="faturamento">Faturamento (Entrada)</MenuItem>
            <MenuItem value="economia">Economia (Saída)</MenuItem>
            <MenuItem value="lucro">Lucro (Entrada - Saída)</MenuItem>
          </TextField>
          <TextField
            label="Data Limite"
            name="data_fim"
            type="date"
            value={form.data_fim}
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
