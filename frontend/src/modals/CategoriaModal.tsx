import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box, CircularProgress, Alert } from "@mui/material";
import { useState, useEffect } from "react";
import type { Categoria } from "@/interfaces/Categoria";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (cat: Categoria) => void;
}

export default function CategoriaModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    nome: "",
    tipo: "entrada",
    icone: "",
    cor: "#1976d2"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setForm({ nome: "", tipo: "entrada", icone: "", cor: "#1976d2" });
      setError(null);
    }
  }, [open]);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error("Erro ao criar categoria");
      const json: Categoria = await res.json();
      onCreated(json);
    } catch (e: any) {
      setError(e.message || "Erro ao criar categoria");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Nova Categoria</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Nome"
            name="nome"
            value={form.nome}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            label="Tipo"
            name="tipo"
            select
            value={form.tipo}
            onChange={handleChange}
            fullWidth
          >
            <MenuItem value="entrada">Receita</MenuItem>
            <MenuItem value="saida">Despesa</MenuItem>
          </TextField>
          <TextField
            label="Ícone"
            name="icone"
            value={form.icone}
            onChange={handleChange}
            fullWidth
            helperText="Ex: fa-solid fa-car"
          />
          <TextField
            label="Cor"
            name="cor"
            type="color"
            value={form.cor}
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
