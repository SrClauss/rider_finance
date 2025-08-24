"use client";
import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from "@mui/material";
import { useSession } from "@/context/SessionContext";

export default function StartSessionModal() {
  const { startModalOpen, closeStartModal, start } = useSession();
  const [plataforma, setPlataforma] = useState<string | null>(null);
  const [clima, setClima] = useState<string | null>(null);
  const [observacoes, setObservacoes] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      await start({ plataforma, clima, observacoes });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!startModalOpen} onClose={closeStartModal} fullWidth maxWidth="sm">
      <DialogTitle>Iniciar sessão de trabalho</DialogTitle>
      <DialogContent>
        <TextField fullWidth label="Plataforma" value={plataforma ?? ""} onChange={(e) => setPlataforma(e.target.value || null)} sx={{ mt: 1 }} />
        <TextField fullWidth label="Clima" value={clima ?? ""} onChange={(e) => setClima(e.target.value || null)} sx={{ mt: 2 }} />
        <TextField fullWidth label="Observações" value={observacoes ?? ""} onChange={(e) => setObservacoes(e.target.value || null)} sx={{ mt: 2 }} multiline rows={3} />
      </DialogContent>
      <DialogActions>
        <Button onClick={closeStartModal} disabled={loading}>Cancelar</Button>
        <Button onClick={handleStart} variant="contained" disabled={loading}>Iniciar</Button>
      </DialogActions>
    </Dialog>
  );
}
