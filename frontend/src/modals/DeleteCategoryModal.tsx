import React, { useEffect, useMemo } from 'react';
import useFormReducer from '@/lib/useFormReducer';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Typography, Stack } from '@mui/material';
import axios from '@/utils/axiosConfig';
import type { Categoria } from '@/interfaces/Categoria';

type Props = {
  open: boolean;
  onClose: () => void;
  categoryId: string | null;
  categorias: Categoria[];
  onCompleted: () => void;
};

export default function DeleteCategoryModal({ open, onClose, categoryId, categorias, onCompleted }: Props) {
  const { state, setField, setLoading, setError, reset } = useFormReducer({ phase: 1, previewCount: null as number | null, selectedTarget: null as string | null, method: 'migrate' as 'migrate' | 'delete', confirmText: '' });
  const phase = Number(state.phase ?? 1);
  const previewCount = state.previewCount as number | null;
  const selectedTarget = state.selectedTarget as string | null;
  const method = state.method as 'migrate' | 'delete';
  const confirmText = String(state.confirmText ?? '');
  const loading = Boolean(state.loading);
  const error = String(state.error ?? '') || null;

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  useEffect(() => {
    if (phase === 1 && categoryId) {
      // fetch preview
      let mounted = true;
      (async () => {
        try {
          setLoading(true);
          const res = await axios.get(`/api/categoria/${categoryId}/preview-delete`, { withCredentials: true });
          if (!mounted) return;
          setField('previewCount', res.data.transactions_count ?? 0);
        } catch {
          if (!mounted) return;
          setError('Falha ao obter contagem de transações');
        } finally {
          if (!mounted) return;
          setLoading(false);
        }
      })();
      return () => { mounted = false; };
    }
  }, [phase, categoryId, setLoading, setField, setError]);

  const otherCategories = useMemo(() => categorias.filter(c => c.id !== categoryId), [categorias, categoryId]);

  const goNext = () => setField('phase', Math.min(3, phase + 1));
  const goPrev = () => setField('phase', Math.max(1, phase - 1));

  const execute = async () => {
    if (!categoryId) return;
    if (method === 'migrate' && (!selectedTarget || selectedTarget === categoryId)) {
      setError('Selecione uma categoria alvo diferente');
      return;
    }
    if (confirmText !== 'DELETAR') {
      setError('Digite DELETAR para confirmar');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await axios.post(`/api/categoria/${categoryId}/execute-delete`, { method, target_id: selectedTarget }, { withCredentials: true });
      // assume success
      onCompleted();
      onClose();
    } catch {
      setError('Falha ao executar operação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Excluir categoria</DialogTitle>
      <DialogContent>
        {phase === 1 && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography>Serão afetadas <strong>{loading ? '...' : (previewCount ?? 0)}</strong> transações nesta categoria.</Typography>
            <Typography color="text.secondary">Escolha o que deseja fazer com essas transações na próxima etapa.</Typography>
          </Stack>
        )}
        {phase === 2 && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField select label="Ação" value={method} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('method', e.target.value as 'migrate' | 'delete')}>
              <MenuItem value="migrate">Migrar para outra categoria</MenuItem>
              <MenuItem value="delete">Deletar transações</MenuItem>
            </TextField>

            {method === 'migrate' && (
              <TextField select label="Categoria destino" value={selectedTarget ?? ''} onChange={(e) => setField('selectedTarget', e.target.value)}>
                <MenuItem value="">Selecione</MenuItem>
                {otherCategories.map(c => (
                    <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>
                  ))}
              </TextField>
            )}

            <Typography color="text.secondary">Resumo: {method === 'migrate' ? `As transações serão movidas para a categoria selecionada.` : `As transações serão removidas permanentemente.`}</Typography>
          </Stack>
        )}
        {phase === 3 && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography color="error">Atenção: esta operação é irreversível.</Typography>
            <Typography color="text.secondary">Para confirmar, digite <strong>DELETAR</strong> abaixo e clique em Executar.</Typography>
            <TextField value={confirmText} onChange={(e) => setField('confirmText', e.target.value)} placeholder="Digite DELETAR" />
          </Stack>
        )}
        {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
      </DialogContent>
      <DialogActions>
        {phase > 1 ? <Button onClick={goPrev}>Voltar</Button> : <Button onClick={onClose}>Cancelar</Button>}
        {phase < 3 ? <Button onClick={goNext} variant="contained">Próximo</Button> : <Button onClick={execute} variant="contained" color="error" disabled={loading}>{loading ? 'Executando...' : 'Executar'}</Button>}
      </DialogActions>
    </Dialog>
  );
}
