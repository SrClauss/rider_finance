"use client";
import React from "react";
import useFormReducer from '@/lib/useFormReducer';
import { Paper, Typography, TextField, Button } from "@mui/material";
import { useRouter } from "next/navigation";

export default function ResetForm({ token }: { token: string }) {
  const { state, setField, setLoading, setError } = useFormReducer({ novaSenha: '', confirmarSenha: '' });
  const novaSenha = String(state.novaSenha ?? '');
  const confirmarSenha = String(state.confirmarSenha ?? '');
  const mensagem = state.error as string | null;
  const loading = Boolean(state.loading);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  setError(null);
    if (novaSenha.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch("/api/reset_password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, nova_senha: novaSenha }),
      });
      const data = await resp.json();
      if (resp.ok && typeof data === "string" && data.includes("sucesso")) {
        setError("Senha redefinida com sucesso! Faça login.");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setError(typeof data === "string" ? data : "Erro ao redefinir senha.");
      }
    } catch (err: unknown) {
      console.error('ResetForm error', err);
      setError("Erro ao conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Redefinir senha
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Nova senha"
          type="password"
          value={novaSenha}
          onChange={(e) => setField('novaSenha', e.target.value)}
          fullWidth
          required
          margin="normal"
        />
        <TextField
          label="Confirmar nova senha"
          type="password"
          value={confirmarSenha}
          onChange={(e) => setField('confirmarSenha', e.target.value)}
          fullWidth
          required
          margin="normal"
        />
        <Button variant="contained" color="primary" type="submit" fullWidth sx={{ mt: 2 }} disabled={loading}>
          {loading ? "Redefinindo..." : "Redefinir Senha"}
        </Button>
      </form>
      {mensagem && (
        <Typography sx={{ mt: 2 }} color={mensagem.includes("sucesso") ? "success.main" : "error.main"}>
          {mensagem}
        </Typography>
      )}
    </Paper>
  );
}
