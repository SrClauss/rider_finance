"use client";
import React, { useReducer } from "react";
import { Box, Card, CardContent, Typography, TextField, Button, Avatar, IconButton, InputAdornment } from "@mui/material";
import { DirectionsCar, Visibility, VisibilityOff } from "@mui/icons-material";
import { ThemeProvider } from "@/theme/ThemeProvider";
import axios from "axios";
import Toast from "@/components/ui/Toast";
import { useState } from "react";
import { useRouter } from "next/navigation";

type State = { usuario: string; senha: string; loading: boolean; error: string | null; showPassword: boolean };
type Action =
  | { type: "SET_USUARIO"; payload: string }
  | { type: "SET_SENHA"; payload: string }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_SHOW_PASSWORD"; payload: boolean };

const initialState: State = { usuario: "", senha: "", loading: false, error: null, showPassword: false };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_USUARIO":
      return { ...state, usuario: action.payload };
    case "SET_SENHA":
      return { ...state, senha: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_SHOW_PASSWORD":
      return { ...state, showPassword: action.payload };
    default:
      return state;
  }
}

export default function AdminLoginPage() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const router = useRouter();
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastSeverity, setToastSeverity] = useState<'error'|'warning'|'info'|'success'>('error');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });
    try {
      const res = await axios.post(
        "/api/admin/login",
        { usuario: state.usuario, senha: state.senha },
        { withCredentials: true }
      );
      if (res.status === 200) {
        router.push("/admin");
      } else {
        dispatch({ type: "SET_ERROR", payload: "Credenciais inválidas" });
      }
    } catch (err: unknown) {
      let msg = "Erro ao logar";
      if (axios.isAxiosError(err)) msg = err.response?.data?.message || err.message || msg;
      dispatch({ type: "SET_ERROR", payload: msg });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
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
              <TextField label="Usuário" fullWidth value={state.usuario} onChange={(e) => dispatch({ type: "SET_USUARIO", payload: e.target.value })} sx={{ mb: 2 }} disabled={state.loading} />
              <TextField label="Senha" fullWidth type={state.showPassword ? "text" : "password"} value={state.senha} onChange={(e) => dispatch({ type: "SET_SENHA", payload: e.target.value })} sx={{ mb: 2 }} disabled={state.loading}
                InputProps={{ endAdornment: (
                  <InputAdornment position="end">
                    <IconButton aria-label="toggle" edge="end" onClick={() => dispatch({ type: "SET_SHOW_PASSWORD", payload: !state.showPassword })} tabIndex={-1}>
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
