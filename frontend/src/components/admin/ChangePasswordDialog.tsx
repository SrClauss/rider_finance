"use client";
import React from "react";
import useFormReducer from '@/lib/useFormReducer';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from "@mui/material";
import { changeAdminPassword } from "@/lib/api/admin";

export default function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, setField, setLoading, setError } = useFormReducer({ current_password: '', new_password: '' });
  const current_password = String(state.current_password ?? '');
  const new_password = String(state.new_password ?? '');
  const loading = Boolean(state.loading);

  const submit = async () => {
    setLoading(true);
    try {
      await changeAdminPassword({ current_password, new_password });
      onClose();
    } catch (e) {
      console.error(e);
      setError('Não foi possível alterar a senha.');
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Trocar senha</DialogTitle>
      <DialogContent>
  <TextField label="Senha atual" type="password" fullWidth value={current_password} onChange={(e) => setField('current_password', e.target.value)} sx={{ mt: 1 }} />
  <TextField label="Nova senha" type="password" fullWidth value={new_password} onChange={(e) => setField('new_password', e.target.value)} sx={{ mt: 2 }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={submit} disabled={loading} variant="contained">{loading ? '...' : 'Salvar'}</Button>
      </DialogActions>
    </Dialog>
  );
}
