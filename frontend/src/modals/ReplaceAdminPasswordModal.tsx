"use client";
import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Stack } from '@mui/material';
import useFormReducer from '@/lib/useFormReducer';
import { extractErrorMessage } from '@/lib/errorUtils';
import Toast from '@/components/ui/Toast';

type Props = { open: boolean; onClose: () => void; adminId: string | null; onReplaced?: () => void };

export default function ReplaceAdminPasswordModal({ open, onClose, adminId, onReplaced }: Props) {
  const { state, setField, setLoading } = useFormReducer<{ senha: string }>({ senha: '' });
  const [toast, setToast] = useState<{ open: boolean; severity?: 'error' | 'success' | 'info' | 'warning'; message: string }>({ open: false, severity: 'info', message: '' });

  const handleReplace = async () => {
    if (!adminId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/${adminId}/password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senha: state.senha }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Erro ao substituir senha');
  onReplaced?.();
  setToast({ open: true, severity: 'success', message: 'Senha substituída com sucesso.' });
  onClose();
    } catch (err: unknown) {
      const msg = extractErrorMessage(err) ?? String(err);
  setToast({ open: true, severity: 'error', message: msg });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Substituir senha do administrador</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Nova senha" type="password" value={state.senha} onChange={(e) => setField('senha', e.target.value)} fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleReplace} disabled={Boolean(state.loading)}>{state.loading ? 'Substituindo...' : 'Substituir'}</Button>
      </DialogActions>
  <Toast open={toast.open} onClose={() => setToast(s => ({ ...s, open: false }))} severity={toast.severity} message={toast.message} />
    </Dialog>
  );
}
