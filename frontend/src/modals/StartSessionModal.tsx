"use client";

import React from 'react';
import useFormReducer from '@/lib/useFormReducer';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
} from '@mui/material';
import { useSession } from '@/context/SessionContext';

interface StartSessionModalProps {
  open: boolean;
  onClose: () => void;
}

export default function StartSessionModal({ open, onClose }: StartSessionModalProps) {
  const { start, loading } = useSession();
  const { state: formData, setField, reset } = useFormReducer({
    local_inicio: '',
    plataforma: '',
    observacoes: '',
    clima: '',
  });

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setField(field, event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      if (start) {
        await start({
          local_inicio: formData.local_inicio || undefined,
          plataforma: formData.plataforma || undefined,
          observacoes: formData.observacoes || undefined,
          clima: formData.clima || undefined,
        });
      }

      // Reset form
      reset();

      onClose();
    } catch (error) {
      console.error('Erro ao iniciar sessão:', error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          🚀 Iniciar Nova Sessão
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Local de Início"
              value={String(formData.local_inicio ?? '')}
              onChange={handleChange('local_inicio')}
              placeholder="Ex: Centro, Zona Sul, etc."
              fullWidth
              variant="outlined"
            />

            <FormControl fullWidth variant="outlined">
              <InputLabel>Plataforma</InputLabel>
              <Select
                value={String(formData.plataforma ?? '')}
                onChange={(e) => setField('plataforma', e.target.value)}
                label="Plataforma"
              >
                <MenuItem value="">
                  <em>Selecione...</em>
                </MenuItem>
                <MenuItem value="Uber">Uber</MenuItem>
                <MenuItem value="99">99</MenuItem>
                <MenuItem value="Rappi">Rappi</MenuItem>
                <MenuItem value="iFood">iFood</MenuItem>
                <MenuItem value="Outros">Outros</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth variant="outlined">
              <InputLabel>Clima</InputLabel>
              <Select
                value={String(formData.clima ?? '')}
                onChange={(e) => setField('clima', e.target.value)}
                label="Clima"
              >
                <MenuItem value="">
                  <em>Selecione...</em>
                </MenuItem>
                <MenuItem value="Sol">☀️ Sol</MenuItem>
                <MenuItem value="Nublado">☁️ Nublado</MenuItem>
                <MenuItem value="Chuva">🌧️ Chuva</MenuItem>
                <MenuItem value="Tempestade">⛈️ Tempestade</MenuItem>
                <MenuItem value="Neve">❄️ Neve</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Observações"
              value={String(formData.observacoes ?? '')}
              onChange={handleChange('observacoes')}
              placeholder="Observações sobre a sessão..."
              fullWidth
              multiline
              rows={3}
              variant="outlined"
            />
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
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            {loading ? 'Iniciando...' : 'Iniciar Sessão'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
