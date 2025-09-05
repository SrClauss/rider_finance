"use client";
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

type Props = { open: boolean; onClose: () => void; onConfirm: () => void; adminName?: string | null };

export default function DeleteAdminConfirmModal({ open, onClose, onConfirm, adminName }: Props) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Confirmar exclusão</DialogTitle>
      <DialogContent>
        <Typography>Deseja realmente excluir o administrador {adminName ? `"${adminName}"` : ''}? Esta ação não pode ser desfeita.</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button color="error" variant="contained" onClick={onConfirm}>Excluir</Button>
      </DialogActions>
    </Dialog>
  );
}
