"use client";
import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from "@mui/material";
import { changeAdminPassword } from "@/lib/api/admin";

export default function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [current_password, setCurrent] = useState('');
  const [new_password, setNew] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await changeAdminPassword({ current_password, new_password });
      onClose();
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Trocar senha</DialogTitle>
      <DialogContent>
        <TextField label="Senha atual" type="password" fullWidth value={current_password} onChange={(e) => setCurrent(e.target.value)} sx={{ mt: 1 }} />
        <TextField label="Nova senha" type="password" fullWidth value={new_password} onChange={(e) => setNew(e.target.value)} sx={{ mt: 2 }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={submit} disabled={loading} variant="contained">{loading ? '...' : 'Salvar'}</Button>
      </DialogActions>
    </Dialog>
  );
}
