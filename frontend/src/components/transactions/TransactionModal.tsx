
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box, CircularProgress, Alert } from "@mui/material";
import { useState } from "react";
import type { Transaction } from "@/interfaces/Transaction";

const categoriasMock = [
  { id: "1", nome: "Alimentação" },
  { id: "2", nome: "Combustível" },
  { id: "3", nome: "Corrida" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (tx: Transaction) => void;
}

export default function TransactionModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    valor: "",
    tipo: "entrada",
    descricao: "",
    id_categoria: "",
    data: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          valor: Number(form.valor),
          tipo: form.tipo,
          descricao: form.descricao,
          id_categoria: form.id_categoria,
          data: form.data ? new Date(form.data).toISOString() : undefined
        })
      });
      if (!res.ok) throw new Error("Erro ao criar transação");
      const json: Transaction = await res.json();
      onCreated(json);
    } catch (e: any) {
      setError(e.message || "Erro ao criar transação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Nova Transação</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Valor"
            name="valor"
            type="number"
            value={form.valor}
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
            label="Categoria"
            name="id_categoria"
            select
            value={form.id_categoria}
            onChange={handleChange}
            fullWidth
          >
            {categoriasMock.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>{cat.nome}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Descrição"
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Data"
            name="data"
            type="date"
            value={form.data}
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
