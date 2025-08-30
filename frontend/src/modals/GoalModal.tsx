import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, MenuItem, CircularProgress, Alert } from "@mui/material";
import { useEffect } from "react";
import axios from "axios";
import useFormReducer from "@/lib/useFormReducer";
import parseNumberToInt from '@/utils/parseNumber';

import { Goal } from "@/interfaces/goal";

type GoalModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  goal?: Goal | null;
};

type GoalForm = {
  titulo: string;
  descricao: string;
  tipo: string;
  categoria: string;
  valor_alvo: string | number;
  valor_atual: string | number;
  unidade: string;
  data_inicio: string;
  data_fim: string;
  eh_ativa: boolean;
  eh_concluida: boolean;
  lembrete_ativo: boolean;
  criado_em: string;
  atualizado_em: string;
  concluida_em?: string | null;
  concluida_com?: string | null;
  loading?: boolean;
  error?: string | null;
};

export default function GoalModal(props: GoalModalProps) {
  const { open, onClose, onSaved, goal } = props;
  const { state: form, setField, setState, reset, setLoading, setError } = useFormReducer<GoalForm>({
    titulo: "",
    descricao: "",
    tipo: "faturamento",
    categoria: "geral",
  valor_alvo: '0,00',
  valor_atual: '0,00',
    unidade: "",
    // data_inicio default para agora (local, formato datetime-local)
    data_inicio: (() => {
      const now = new Date();
      const tzOffset = now.getTimezoneOffset() * 60000;
      return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
    })(),
    data_fim: "",
    eh_ativa: true,
    eh_concluida: false,
    lembrete_ativo: false,
    criado_em: "",
    atualizado_em: ""
  });

  useEffect(() => {
    if (open && goal) {
      // converte valores em centavos (inteiros) para string com duas casas e vírgula
      const formatFromCents = (v: any) => {
        const n = Number(v);
        if (isNaN(n)) return '0,00';
        return (n / 100).toFixed(2).replace('.', ',');
      };
      setState({
        titulo: goal.titulo || "",
        descricao: goal.descricao || "",
        tipo: goal.tipo || "faturamento",
        categoria: goal.categoria || "geral",
  valor_alvo: goal.valor_alvo != null ? formatFromCents(goal.valor_alvo) : '0,00',
  valor_atual: goal.valor_atual != null ? formatFromCents(goal.valor_atual) : '0,00',
        unidade: goal.unidade || "",
        // converte as datas do backend para o formato do input datetime-local (YYYY-MM-DDTHH:mm)
        data_inicio: goal.data_inicio ? (() => {
          try {
            const s = goal.data_inicio as string;
            const parsed = new Date((s.includes('T') && !s.includes('Z') && !s.includes('+')) ? s + 'Z' : s);
            const tzOffset = parsed.getTimezoneOffset() * 60000;
            return new Date(parsed.getTime() - tzOffset).toISOString().slice(0, 16);
          } catch { return new Date().toISOString().slice(0, 16); }
        })() : (() => {
          const now = new Date();
          const tzOffset = now.getTimezoneOffset() * 60000;
          return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
        })(),
        data_fim: goal.data_fim ? (() => {
          try {
            const s = goal.data_fim as string;
            const parsed = new Date((s.includes('T') && !s.includes('Z') && !s.includes('+')) ? s + 'Z' : s);
            const tzOffset = parsed.getTimezoneOffset() * 60000;
            return new Date(parsed.getTime() - tzOffset).toISOString().slice(0, 16);
          } catch { return ""; }
        })() : "",
        eh_ativa: goal.eh_ativa ?? true,
        eh_concluida: goal.eh_concluida ?? false,
        criado_em: goal.criado_em || "",
        atualizado_em: goal.atualizado_em || ""
      });
    } else if (open) {
      reset();
    }
  }, [open, goal, reset, setState]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    // Para campos numéricos, armazenamos o valor cru (string) enquanto o usuário digita
    if (name === "valor_alvo" || name === "valor_atual") {
      setField(name, value);
      return;
    }
    setField(name, value);
  };

  const handleBlurNumeric = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    if (name === 'valor_alvo' || name === 'valor_atual') {
      // Se vazio, define '0,00'; caso contrário normaliza vírgula/ponto
      if (!value || String(value).trim() === '') {
        setField(name, '0,00');
        return;
      }
      // normaliza ponto/virgula para manter vírgula como separador
      const normalized = String(value).replace(/\./g, '').replace(/,/, '.');
      const num = Number(normalized);
      if (isNaN(num)) {
        setField(name, '0,00');
      } else {
        // reformatar para duas casas e vírgula
        setField(name, (num).toFixed(2).replace('.', ','));
      }
    }
  };

  const handleSubmit = async () => {
  // Validação: se data_fim informada, deve ser maior que data_inicio
  if (form.data_fim && form.data_inicio) {
    try {
      const dtInicio = new Date(String(form.data_inicio));
      const dtFim = new Date(String(form.data_fim));
      if (isNaN(dtInicio.getTime()) || isNaN(dtFim.getTime()) || dtFim.getTime() <= dtInicio.getTime()) {
        setError('A data final deve ser posterior à data de início');
        return;
      }
    } catch {
      setError('Formato de data inválido');
      return;
    }
  }
  setLoading(true);
  setError(null);
    try {
      // Monta payload compatível com o backend Rust
      const payload = {
        titulo: form.titulo,
        descricao: form.descricao || null,
        tipo: form.tipo,
        categoria: form.categoria,
  // backend espera i32 — enviar números inteiros
  valor_alvo: parseNumberToInt(form.valor_alvo),
  valor_atual: parseNumberToInt(form.valor_atual),
        unidade: form.unidade || null,
        data_inicio: form.data_inicio ? new Date(form.data_inicio).toISOString().slice(0, 19) : null,
        data_fim: form.data_fim ? new Date(form.data_fim).toISOString().slice(0, 19) : null,
        eh_ativa: form.eh_ativa,
        eh_concluida: form.eh_concluida,
        concluida_em: form.concluida_em || null,
        concluida_com: form.concluida_com ?? null
      };
      console.log('[GoalModal] Payload:', payload);
      if (goal && goal.id) {
        await axios.put(`/api/meta/${goal.id}`, payload, { withCredentials: true });
      } else {
        await axios.post(`/api/meta`, payload, { withCredentials: true });
      }
      onSaved();
    } catch (err: unknown) {
      const maybe = err as { response?: { data?: { message?: string } } } | undefined;
      setError(maybe?.response?.data?.message || "Erro ao salvar meta");
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
            type="text"
            value={String(form.valor_alvo ?? '')}
            onChange={handleChange}
            onBlur={handleBlurNumeric}
            fullWidth
            required
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Data de Início"
              name="data_inicio"
              type="datetime-local"
              value={form.data_inicio}
              onChange={handleChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              label="Data Limite"
              name="data_fim"
              type="datetime-local"
              value={form.data_fim}
              onChange={handleChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
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
