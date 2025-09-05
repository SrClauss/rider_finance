"use client";
import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Stack } from '@mui/material';
import useFormReducer from '@/lib/useFormReducer';
import { extractErrorMessage } from '@/lib/errorUtils';
import Toast from '@/components/ui/Toast';

type Props = { open: boolean; onClose: () => void; onCreated?: () => void };

export default function CreateAdminModal({ open, onClose, onCreated }: Props) {
  const { state, setField, setLoading, reset } = useFormReducer<{ username: string; password: string }>({ username: '', password: '' });
  const [toast, setToast] = useState<{ open: boolean; severity?: 'error' | 'success' | 'info' | 'warning'; message: string }>({ open: false, severity: 'info', message: '' });

  const handleCreate = async () => {
    setLoading(true);
    try {
  const res = await fetch('/api/admin/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: state.username, password: state.password }), credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Erro ao criar admin');
      reset();
      onCreated?.();
  setToast({ open: true, severity: 'success', message: 'Administrador criado com sucesso.' });
  onClose();
    } catch (err: unknown) {
      const msg = extractErrorMessage(err) ?? String(err);
  setToast({ open: true, severity: 'error', message: msg });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Criar administrador</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Usuário" value={state.username} onChange={(e) => setField('username', e.target.value)} fullWidth />
          <TextField label="Senha" type="password" value={state.password} onChange={(e) => setField('password', e.target.value)} fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleCreate} disabled={Boolean(state.loading)}>{state.loading ? 'Criando...' : 'Criar'}</Button>
      </DialogActions>
  <Toast open={toast.open} onClose={() => setToast(s => ({ ...s, open: false }))} severity={toast.severity} message={toast.message} />
    </Dialog>
  );
}
  