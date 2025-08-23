import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box, CircularProgress, Alert } from "@mui/material";
import { useEffect } from "react";
import axios from "axios";
import useFormReducer from "@/lib/useFormReducer";
import type { Categoria } from "@/interfaces/Categoria";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (cat: Categoria) => void;
}

// Form initial state
const initialState = {
  nome: '',
  tipo: 'entrada' as 'entrada' | 'saida',
  icone: '',
  cor: '#1976d2',
};

export default function CategoriaModal({ open, onClose, onCreated }: Props) {
  const { state, setField, reset, setLoading, setError } = useFormReducer(initialState);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setField(name, value);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        nome: state.nome,
        tipo: state.tipo,
        icone: state.icone,
        cor: state.cor,
      };
      try {
        const res = await axios.post('/api/categorias', payload, { withCredentials: true });
        const json: Categoria = res.data;
        onCreated(json);
        reset();
      } catch (err: any) {
        throw new Error(err?.response?.data?.message || 'Erro ao criar categoria');
      }
    } catch (e: any) {
      setError(e.message || 'Erro ao criar categoria');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Nova Categoria</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Nome"
            name="nome"
            value={state.nome}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            label="Tipo"
            name="tipo"
            select
            value={state.tipo}
            onChange={handleChange}
            fullWidth
          >
            <MenuItem value="entrada">Receita</MenuItem>
            <MenuItem value="saida">Despesa</MenuItem>
          </TextField>
          <TextField
            label="Ícone"
            name="icone"
            value={state.icone}
            onChange={handleChange}
            fullWidth
            helperText="Ex: fa-solid fa-car"
          />
          <TextField
            label="Cor"
            name="cor"
            type="color"
            value={state.cor}
            onChange={handleChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          {state.error && <Alert severity="error">{state.error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" disabled={state.loading}>
          {state.loading ? <CircularProgress size={20} /> : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
