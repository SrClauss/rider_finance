import { useEffect } from "react";
import { carregarCategorias } from "@/context/CategoriaContext";

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box, CircularProgress, Alert } from "@mui/material";
import { useState } from "react";

import type { Transaction } from "@/interfaces/Transaction";
import { CategoriaProvider, useCategoriaContext } from "@/context/CategoriaContext";


interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (tx: Transaction) => void;
  onEdited?: (tx: Transaction) => void;
  transaction?: Transaction | null;
}


export default function TransactionModal({ open, onClose, onCreated, onEdited, transaction }: Props) {
  return (
    <CategoriaProvider>
      <TransactionModalInner
        open={open}
        onClose={onClose}
        onCreated={onCreated}
        onEdited={onEdited}
        transaction={transaction}
      />
    </CategoriaProvider>
  );
}

function TransactionModalInner({ open, onClose, onCreated, onEdited, transaction }: Props) {
  // Função para obter data/hora local no formato 'YYYY-MM-DDTHH:mm'
  function getNowLocalISO() {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISO = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISO;
  }
  const [form, setForm] = useState({
    valor: "",
    tipo: "entrada",
    descricao: "",
    id_categoria: "",
    data: getNowLocalISO()
  });

  // Preencher formulário ao abrir para edição
  useEffect(() => {
    if (open && transaction) {
      setForm({
        valor: transaction.valor.toString(),
        tipo: transaction.tipo,
        descricao: transaction.descricao || "",
        id_categoria: transaction.id_categoria,
        data: transaction.data ? transaction.data.slice(0, 16) : getNowLocalISO(),
      });
    } else if (open && !transaction) {
      setForm({
        valor: "",
        tipo: "entrada",
        descricao: "",
        id_categoria: "",
        data: getNowLocalISO()
      });
    }
  }, [open, transaction]);
  const { categorias, setCategorias } = useCategoriaContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar categorias ao abrir o modal se necessário
  useEffect(() => {
    if (open && (!categorias || categorias.length === 0)) {
      carregarCategorias().then(setCategorias).catch(() => {});
    }
  }, [open]);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      // Garantir que valor seja inteiro (backend espera i32)
      const valorInt = Math.round(Number(form.valor));
      // Garantir tipo correto
      const tipo = form.tipo === 'entrada' || form.tipo === 'saida' ? form.tipo : 'entrada';
      // Montar payload compatível
      const payload: any = {
        valor: valorInt,
        tipo,
        id_categoria: form.id_categoria,
      };
      if (form.descricao && form.descricao.trim()) payload.descricao = form.descricao.trim();
      if (form.data) {
        // Garante formato 'YYYY-MM-DDTHH:mm:ss' para o backend Rust
        // form.data vem como 'YYYY-MM-DDTHH:mm' (datetime-local)
        const [date, time] = form.data.split('T');
        let dataFormatada = form.data;
        if (date && time) {
          // Garante segundos
          const [hh, mm] = time.split(":");
          dataFormatada = `${date}T${hh}:${mm}:00`;
        }
        payload.data = dataFormatada;
      }
      if (transaction && onEdited) {
        // Edição
        const res = await fetch(`/api/transacao/${transaction.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ ...payload, id: transaction.id })
        });
        if (!res.ok) {
          let msg = "Erro ao editar transação";
          try {
            const err = await res.json();
            if (err && err.message) msg = err.message;
          } catch {}
          throw new Error(msg);
        }
        const json: Transaction = await res.json();
        onEdited(json);
      } else {
        // Criação
        const res = await fetch("/api/transacao", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          let msg = "Erro ao criar transação";
          try {
            const err = await res.json();
            if (err && err.message) msg = err.message;
          } catch {}
          throw new Error(msg);
        }
        const json: Transaction = await res.json();
        onCreated(json);
      }
    } catch (e: any) {
      setError(e.message || (transaction ? "Erro ao editar transação" : "Erro ao criar transação"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{transaction ? "Editar Transação" : "Nova Transação"}</DialogTitle>
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
            required
          >
            {categorias && categorias.length > 0 ? (
              categorias.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>{cat.nome}</MenuItem>
              ))
            ) : (
              <MenuItem value="" disabled>Nenhuma categoria encontrada</MenuItem>
            )}
          </TextField>
          <TextField
            label="Descrição"
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Data e Hora"
            name="data"
            type="datetime-local"
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
