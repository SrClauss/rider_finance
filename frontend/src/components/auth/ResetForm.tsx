"use client";
import React, { useState } from "react";
import { Paper, Typography, TextField, Button } from "@mui/material";
import { useRouter } from "next/navigation";

export default function ResetForm({ token }: { token: string }) {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem(null);
    if (novaSenha.length < 6) {
      setMensagem("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setMensagem("As senhas não coincidem.");
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
        setMensagem("Senha redefinida com sucesso! Faça login.");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setMensagem(typeof data === "string" ? data : "Erro ao redefinir senha.");
      }
    } catch (err: unknown) {
      console.error('ResetForm error', err);
      setMensagem("Erro ao conectar ao servidor.");
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
          onChange={(e) => setNovaSenha(e.target.value)}
          fullWidth
          required
          margin="normal"
        />
        <TextField
          label="Confirmar nova senha"
          type="password"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
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
