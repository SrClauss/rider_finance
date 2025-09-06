"use client";
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

type Props = { open: boolean; onClose: () => void; onConfirm: () => void; userName?: string | null };

export default function DeleteUserConfirmModal({ open, onClose, onConfirm, userName }: Props) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Confirmar exclusão do usuário</DialogTitle>
      <DialogContent>
        <Typography>Deseja realmente excluir o usuário {userName ? `"${userName}"` : ''}? Esta ação não pode ser desfeita.</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button color="error" variant="contained" onClick={onConfirm}>Excluir</Button>
      </DialogActions>
    </Dialog>
  );
}
