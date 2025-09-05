
"use client";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  InputAdornment,
} from "@mui/material";
import Toast from "@/components/ui/Toast";
import Divider from "@mui/material/Divider";
import NextLink from "next/link";
import { DirectionsCar, Visibility, VisibilityOff } from "@mui/icons-material";
import {ThemeProvider} from "@/theme/ThemeProvider";
import React from "react";
import { useRouter } from 'next/navigation';
import axios from "axios";
import useFormReducer from '@/lib/useFormReducer';
import { extractErrorMessage } from '@/lib/errorUtils';
// Import package.json to show app version
import pkg from '../../../package.json';

type State = {
  usuario: string;
  senha: string;
  loading: boolean;
  error: string | null;
  showPassword: boolean;
};

const initialState: State = {
  usuario: "",
  senha: "",
  loading: false,
  error: null,
  showPassword: false,
};

export default function Page() {
  const { state, setField, setLoading, setError } = useFormReducer<State>({ ...initialState });
  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);
  const [toastSeverity, setToastSeverity] = React.useState<'error'|'warning'|'info'|'success'>('error');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  setLoading(true);
  setError(null);
    try {
      const response = await axios.post(
        "/api/login",
        {
          usuario: state.usuario,
          senha: state.senha,
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      if (response.status === 200) {
        await router.push('/dashboard');
      } else {
        setError("Usuário ou senha inválidos");
      }
    } catch (err: unknown) {
      const msg = extractErrorMessage(err) ?? 'Erro ao logar';
      setError(msg);
      setToastMsg(msg);
      setToastSeverity('error');
      setToastOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider>
      <Box
        sx={{
          position: 'relative',
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #181818 0%, #232323 100%)",
          p: 2,
        }}
      >
        {/* App version in top-right */}
        <Box sx={{ position: 'absolute', top: 12, right: 16, p: 1 }}>
          <Typography variant="caption" color="text.secondary">v{pkg.version}</Typography>
        </Box>
        <Card
          sx={{
            maxWidth: 400,
            width: "100%",
            backgroundColor: "background.paper",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Box informativo do usuário de teste */}
            <Box sx={{ mb: 2, p: 2, borderRadius: 2, background: '#f5f5f5', border: '1px solid #e0e0e0', textAlign: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                Usuário de Teste
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Login:</strong> seed_user<br />
                <strong>Senha:</strong> senha123
              </Typography>
            </Box>

            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  margin: "0 auto",
                  backgroundColor: "primary.main",
                  mb: 2,
                }}
              >
                <DirectionsCar sx={{ fontSize: 32 }} />
              </Avatar>

              <Typography variant="h4" fontWeight={700} gutterBottom>
                Rider Finance
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Sistema financeiro para motoristas de aplicativo
              </Typography>

              <form onSubmit={handleSubmit}>
                <TextField
                  id="usuario"
                  fullWidth
                  label="E-mail ou usuário"
                  type="text"
                  value={state.usuario}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('usuario', e.target.value)}
                  sx={{ mb: 2 }}
                  disabled={state.loading}
                />

                  <TextField
                  id="senha"
                  fullWidth
                  label="Senha"
                  type={state.showPassword ? "text" : "password"}
                  value={state.senha}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('senha', e.target.value)}
                  sx={{ mb: 3 }}
                  disabled={state.loading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={
                            state.showPassword ? "Ocultar senha" : "Mostrar senha"
                          }
                          onClick={() => setField('showPassword', !state.showPassword)}
                          edge="end"
                          tabIndex={-1}
                        >
                          {state.showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {state.error && (
                  <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                    {state.error}
                  </Typography>
                )}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  sx={{ mb: 2, height: 48, fontWeight: 600 }}
                  disabled={state.loading}
                >
                  {state.loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>

              <Box sx={{ textAlign: "center", mb: 2 }}>
                <NextLink href="/forgot" style={{ fontSize: "0.875rem", textDecoration: "underline", cursor: "pointer", color: "#1976d2" }}>
                  Esqueceu sua senha?
                </NextLink>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Não tem uma conta? {" "}
                  <NextLink href="/register" style={{ fontWeight: 600, textDecoration: "underline", cursor: "pointer", color: "#1976d2" }}>
                    Cadastre-se
                  </NextLink>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Toast open={toastOpen} onClose={() => setToastOpen(false)} severity={toastSeverity} message={toastMsg ?? ''} />
    </ThemeProvider>
  );
}

