import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from "@mui/material";
import axios from 'axios';
import { extractErrorMessage } from '@/lib/errorUtils';
import { useMetasContext } from '@/context/MetasContext';
import { Transacao } from '@/interfaces/transacao';

interface ConfirmDeleteModalProps {
  open: boolean;
  onClose: () => void;
  // antiga callback opcional preservada para compatibilidade
  onConfirm?: () => void;
  // id da transacao a ser deletada — centraliza a deleção aqui
  idToDelete?: string | null;
  onDeleted?: (id: string) => void;
  title?: string;
  description?: string;
}

export default function ConfirmDeleteModal({ open, onClose, onConfirm, idToDelete = null, onDeleted, title = "Confirmar exclusão", description = "Tem certeza que deseja deletar este item? Esta ação não pode ser desfeita." }: ConfirmDeleteModalProps) {
  const { dispatchTransacoes } = useMetasContext(); // ← Corrigido: dispatchTransacoes (plural)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    // preserva antiga chamada externa
    if (onConfirm) {
      try { onConfirm(); } catch {}
    }
    if (!idToDelete) {
      setError('ID da transação não informado');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`/api/transacao/${idToDelete}`);
      // atualiza MetasContext - cria objeto Transacao mínimo para dispatch
      try { 
  const transacaoToDelete = { id: idToDelete } as Transacao;
  dispatchTransacoes(transacaoToDelete, 'delete'); 
      } catch {}
      // SessionContext será atualizado automaticamente quando necessário
      try { if (onDeleted) onDeleted(idToDelete); } catch {}
      onClose();
    } catch (err: unknown) {
      const msg = extractErrorMessage(err) ?? 'Erro ao deletar transação';
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: '#ff1744' }}>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 1 }}>
          <Typography variant="body1" sx={{ color: '#fff', mb: 2 }}>{description}</Typography>
          {error && <Typography variant="body2" sx={{ color: '#ff7961' }}>{error}</Typography>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" variant="outlined" sx={{ borderRadius: 2 }} disabled={loading}>Cancelar</Button>
        <Button onClick={handleDelete} color="error" variant="contained" sx={{ borderRadius: 2, fontWeight: 700 }} disabled={loading}>{loading ? 'Deletando...' : 'Deletar'}</Button>
      </DialogActions>
    </Dialog>
  );
}
