"use client";
import React from "react";
import { Box, Card, CardContent, Typography, TextField, Button, Avatar, IconButton, InputAdornment } from "@mui/material";
import { DirectionsCar, Visibility, VisibilityOff } from "@mui/icons-material";
import { ThemeProvider } from "@/theme/ThemeProvider";
import axios from "axios";
import Toast from "@/components/ui/Toast";
import { useState } from "react";
import useFormReducer from '@/lib/useFormReducer';
import { extractErrorMessage } from '@/lib/errorUtils';
import { useRouter } from "next/navigation";

type State = { usuario: string; senha: string; loading: boolean; error: string | null; showPassword: boolean };
const initialState: State = { usuario: "", senha: "", loading: false, error: null, showPassword: false };

export default function AdminLoginPage() {
  const { state, setField, setLoading, setError } = useFormReducer<State>(initialState);
  const router = useRouter();
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg] = useState<string | null>(null);
  const [toastSeverity] = useState<'error'|'warning'|'info'|'success'>('error');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        "/api/admin/login",
        { usuario: state.usuario, senha: state.senha },
        { withCredentials: true }
      );
      if (res.status === 200) {
        router.push("/admin");
      } else {
        setError("Credenciais inválidas");
      }
    } catch (err: unknown) {
      const msg = extractErrorMessage(err) ?? 'Erro ao logar';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider>
  <Toast open={toastOpen} onClose={() => setToastOpen(false)} severity={toastSeverity} message={toastMsg ?? ''} />
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #181818 0%, #232323 100%)", p: 2 }}>
        <Card sx={{ maxWidth: 420, width: "100%", backgroundColor: "background.paper" }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: "center", mb: 3 }}>
              <Avatar sx={{ width: 64, height: 64, margin: "0 auto", backgroundColor: "primary.main", mb: 2 }}>
                <DirectionsCar sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h5" fontWeight={700}>Painel Administrativo</Typography>
              <Typography variant="body2" color="text.secondary">Acesse com credenciais administrativas</Typography>
            </Box>
            <Box component="form" onSubmit={handleSubmit}>
              <TextField label="Usuário" fullWidth value={state.usuario} onChange={(e) => setField('usuario', e.target.value)} sx={{ mb: 2 }} disabled={state.loading} />
              <TextField label="Senha" fullWidth type={state.showPassword ? "text" : "password"} value={state.senha} onChange={(e) => setField('senha', e.target.value)} sx={{ mb: 2 }} disabled={state.loading}
                InputProps={{ endAdornment: (
                  <InputAdornment position="end">
                    <IconButton aria-label="toggle" edge="end" onClick={() => setField('showPassword', !state.showPassword)} tabIndex={-1}>
                      {state.showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ) }}
              />
              {state.error && <Typography color="error" sx={{ mb: 2 }}>{state.error}</Typography>}
              <Button type="submit" fullWidth variant="contained" size="large" disabled={state.loading}>{state.loading ? "Entrando..." : "Entrar"}</Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </ThemeProvider>
  );
}
