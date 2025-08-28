import { useEffect } from "react";
import axios from "axios";
import { carregarCategorias } from "@/context/CategoriaContext";
import { extractErrorMessage } from '@/lib/errorUtils';
import { useSession } from "@/context/SessionContext";

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box, CircularProgress, Alert } from "@mui/material";
import useFormReducer from "@/lib/useFormReducer";

import type { Transaction } from "@/interfaces/Transaction";
import { useMetasContext } from "@/context/MetasContext";
// AcaoTransacao not used here
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
  const { dispatchTransacao } = useMetasContext();
  const { sessaoAtual, attachTransaction } = useSession();
  // Função para obter data/hora local no formato 'YYYY-MM-DDTHH:mm'
  function getNowLocalISO() {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISO = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISO;
  }
  const { state: form, setField, setState, reset, setLoading, setError } = useFormReducer<{ valor: string; tipo: string; descricao: string; id_categoria: string; data: string }>({
    valor: "",
    tipo: "entrada",
    descricao: "",
    id_categoria: "",
    data: getNowLocalISO(),
  });

  // Preencher formulário ao abrir para edição
  useEffect(() => {
    if (open && transaction) {
      setState({
        valor: transaction.valor.toString(),
        tipo: transaction.tipo,
        descricao: transaction.descricao || "",
        id_categoria: transaction.id_categoria,
        data: transaction.data ? transaction.data.slice(0, 16) : getNowLocalISO(),
      });
    } else if (open && !transaction) {
      reset();
    }
  }, [open, transaction, reset, setState]);
  const { categorias, setCategorias } = useCategoriaContext();
  // loading/error are managed by the reducer via setLoading/setError; form.loading / form.error available if needed

  // Carregar categorias ao abrir o modal se necessário
  useEffect(() => {
    if (open && (!categorias || categorias.length === 0)) {
      carregarCategorias().then(setCategorias).catch(() => {});
    }
  }, [open, categorias, setCategorias]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setField(e.target.name, e.target.value);
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
  const payload: { [k: string]: unknown } = {
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
        try {
          const res = await axios.put(`/api/transacao/${transaction.id}`, { ...payload, id: transaction.id }, { withCredentials: true });
          const json: Transaction = res.data;
          dispatchTransacao(json, 'update');
          onEdited(json);
        } catch (err: unknown) {
          const msg = extractErrorMessage(err) ?? 'Erro ao editar transação';
          throw new Error(msg);
        }
      } else {
        // Criação
        try {
          // attach session id if exists (use hook values captured at top)
          if (sessaoAtual && sessaoAtual.id) payload.id_sessao = sessaoAtual.id;
          const res = await axios.post('/api/transacao', payload, { withCredentials: true });
          const json: Transaction = res.data;
          // optimistic attach to session context
          try {
            if (attachTransaction) attachTransaction(json);
          } catch {
            // ignore
          }
          dispatchTransacao(json, 'add');
          onCreated(json);
        } catch (err: unknown) {
          const msg = extractErrorMessage(err) ?? 'Erro ao criar transação';
          throw new Error(msg);
        }
      }
    } catch (err: unknown) {
      const msg = extractErrorMessage(err) ?? (transaction ? "Erro ao editar transação" : "Erro ao criar transação");
      setError(msg);
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
          {form.error && <Alert severity="error">{form.error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" disabled={form.loading}>
          {form.loading ? <CircularProgress size={20} /> : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
