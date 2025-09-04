import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box, CircularProgress, Alert, Autocomplete } from "@mui/material";
import React, { useEffect, useState, ChangeEvent, SyntheticEvent } from "react";
import axios from "axios";
import { extractErrorMessage } from '@/lib/errorUtils';
import useFormReducer from "@/lib/useFormReducer";
import type { Categoria } from "@/interfaces/Categoria";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (cat: Categoria) => void;
  categoria?: Categoria | null;
  onUpdated?: (cat: Categoria) => void;
}

// Form initial state
const initialState = {
  nome: '',
  tipo: 'entrada' as 'entrada' | 'saida',
  icone: '',
  cor: '#1976d2',
};

// Uma lista de ícones Font Awesome (free) para busca/seleção. Pode ser estendida.
const ICON_SUGGESTIONS = [
  'fas fa-utensils', 'fas fa-gas-pump', 'fas fa-car-side', 'fab fa-uber', 'fas fa-money-bill-wave',
  'fas fa-credit-card', 'fas fa-shopping-cart', 'fas fa-heart', 'fas fa-home', 'fas fa-briefcase',
  'fas fa-apple-alt', 'fas fa-coffee', 'fas fa-film', 'fas fa-plane', 'fas fa-bus',
  'fas fa-subway', 'fas fa-taxi', 'fas fa-motorcycle', 'fas fa-bicycle', 'fas fa-wrench',
  'fas fa-tools', 'fas fa-gift', 'fas fa-shopping-bag', 'fas fa-hotel', 'fas fa-gas-pump',
  'fas fa-book', 'fas fa-calendar-alt', 'fas fa-chart-line', 'fas fa-piggy-bank', 'fas fa-wallet',
  'fas fa-users', 'fas fa-user', 'fas fa-phone', 'fas fa-envelope', 'fas fa-medkit',
  'fas fa-home', 'fas fa-music', 'fas fa-bell', 'fas fa-lightbulb', 'fas fa-seedling',
  'fas fa-tree', 'fas fa-car', 'fas fa-truck', 'fas fa-umbrella', 'fas fa-utensil-spoon',
  'fab fa-amazon', 'fab fa-apple', 'fab fa-google', 'fab fa-paypal', 'fab fa-cc-visa'
];

// Garantir que não existam entradas duplicadas (evita keys repetidas no React)
// normaliza espaços e remove duplicatas
const ICON_LIST = Array.from(new Set(ICON_SUGGESTIONS.map(s => s.trim())));

export default function CategoriaModal({ open, onClose, onCreated, categoria, onUpdated }: Props) {
  const { state, setField, reset, setLoading, setError } = useFormReducer(initialState);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
  }, [open, reset]);

  // Prefill when categoria prop changes
  useEffect(() => {
    if (categoria && open) {
      setField('nome', categoria.nome || '');
      setField('tipo', (categoria.tipo as 'entrada' | 'saida') || 'entrada');
      setField('icone', categoria.icone || '');
      setField('cor', categoria.cor || '#1976d2');
    }
  }, [categoria, open, setField]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target as HTMLInputElement;
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
        if (categoria && categoria.id) {
          // update
          const res = await axios.put(`/api/categoria/${categoria.id}`, payload, { withCredentials: true });
          const json: Categoria = res.data;
          if (onUpdated) onUpdated(json);
          reset();
        } else {
          const res = await axios.post('/api/categoria', payload, { withCredentials: true });
          const json: Categoria = res.data;
          if (onCreated) onCreated(json);
          reset();
        }
      } catch (err: unknown) {
        const msg = extractErrorMessage(err) ?? (err instanceof Error ? err.message : 'Erro ao criar/editar categoria');
        throw new Error(msg);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao criar categoria';
      setError(msg);
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
          <Autocomplete
            freeSolo
            options={ICON_LIST}
            value={state.icone}
            onChange={(e: SyntheticEvent, v: string | null) => setField('icone', v || '')}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Ícone"
                name="icone"
                onChange={handleChange}
                helperText="Ex: fas fa-utensils ou fab fa-uber"
                fullWidth
              />
            )}
          />
          {/* Campo de busca e grade filtrada com pré-visualização clicável */}
          <TextField
            label="Buscar ícone"
            placeholder="ex: car, food, shop"
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            fullWidth
          />
          <Box sx={{ maxHeight: 160, overflow: 'auto', mt: 1 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))',
                gap: 1,
              }}
            >
              {ICON_LIST
                .filter((c) => {
                  if (!search) return true;
                  const term = search.toLowerCase();
                  return c.toLowerCase().includes(term) || c.split(' ').some(p => p.includes(term));
                })
                .slice(0, 200)
                .map((c, idx) => (
                  <Button
                    key={`${c}-${idx}`}
                    onClick={() => setField('icone', c)}
                    variant={state.icone === c ? 'contained' : 'outlined'}
                    size="small"
                    sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 1 }}
                    aria-label={`Selecionar ${c}-${idx}`}
                  >
                    <i className={c} style={{ fontSize: 18 }} aria-hidden />
                    <Box component="span" sx={{ fontSize: 10, mt: 0.5, textAlign: 'center' }}>{c.replace(/\s+/g, ' ')}</Box>
                  </Button>
                ))}
            </Box>
          </Box>
          {/* Preview do ícone selecionado */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
            <Box sx={{ minWidth: 40 }}>
              {state.icone ? (
                <i className={state.icone} style={{ fontSize: 28 }} aria-hidden />
              ) : (
                <i className="fas fa-question" style={{ fontSize: 20 }} aria-hidden />
              )}
            </Box>
            <Box sx={{ color: 'text.secondary' }}>{state.icone || 'Nenhum ícone selecionado'}</Box>
          </Box>
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
