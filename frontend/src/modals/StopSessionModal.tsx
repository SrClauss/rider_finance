"use client";

import React from 'react';
import useFormReducer from '@/lib/useFormReducer';
import { formatUtcToLocalString, getUserTimezone } from '@/utils/dateUtils';
import { useUsuarioContext } from '@/context/SessionContext';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
} from '@mui/material';
import { useSession } from '@/context/SessionContext';

interface StopSessionModalProps {
  open: boolean;
  onClose: () => void;
}

export default function StopSessionModal({ open, onClose }: StopSessionModalProps) {
  const { stop, loading, sessao, elapsedSeconds } = useSession();
  const { configuracoes } = useUsuarioContext();
  const userTimezone = getUserTimezone(configuracoes);
  const { state, setField, reset } = useFormReducer({ local_fim: '' });
  const local_fim = String(state.local_fim ?? '');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      // O stop atual não aceita parâmetros adicionais, então por enquanto
      // só vamos fechar a sessão normalmente
      if (stop) {
        await stop(local_fim || undefined);
      }

  // Reset form
  reset();
      onClose();
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Calcular tempo decorrido
  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          🛑 Encerrar Sessão
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {sessao?.sessao && (
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Tempo decorrido: {formatElapsedTime(elapsedSeconds || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Iniciada em: {formatUtcToLocalString(sessao.sessao.inicio, userTimezone)}
                </Typography>
              </Box>
            )}

            <TextField
              label="Local de Fim"
              value={local_fim}
              onChange={(e) => setField('local_fim', e.target.value)}
              placeholder="Ex: Centro, Zona Sul, etc."
              fullWidth
              variant="outlined"
            />

            <Typography variant="body2" color="text.secondary">
              💰 Os totais serão calculados automaticamente com base nas transações realizadas durante a sessão.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="error"
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            {loading ? 'Encerrando...' : 'Encerrar Sessão'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
