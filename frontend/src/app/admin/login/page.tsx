"use client";
import React, { useEffect } from "react";
import { Box, Card, CardContent, Typography, TextField, Button, Avatar, IconButton, InputAdornment, Stack } from "@mui/material";
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
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaImage, setCaptchaImage] = useState<string | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        "/api/admin/login",
  { usuario: state.usuario, senha: state.senha, captcha_token: captchaToken, captcha_answer: captchaAnswer },
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

  async function fetchCaptcha() {
    try {
      const res = await axios.get('/api/captcha');
      if (res?.data) {
        setCaptchaToken(res.data.token);
        setCaptchaImage(`data:image/png;base64,${res.data.png}`);
      }
      } catch (_e) {
        // ignore
      }
  }

  useEffect(() => {
    fetchCaptcha();
  }, []);

  return (
    <ThemeProvider>
      <Toast open={toastOpen} onClose={() => setToastOpen(false)} severity={toastSeverity} message={toastMsg ?? ''} />
      
        <Card sx={{ width: '100%', maxWidth: { xs: 400, md: 980 }, borderRadius: 2, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 320 }}>
            <Box sx={{ flex: 1 }}>
              <CardContent sx={{ p: { xs: 4, md: 6 } }}>
                  <Stack spacing={2} alignItems="center" sx={{ mb: 2, textAlign: { xs: 'center', md: 'left' } }}>
                  <Avatar sx={{ width: 72, height: 72, bgcolor: 'primary.main' }}>
                    <DirectionsCar sx={{ fontSize: 36 }} />
                  </Avatar>
                  <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: '2rem', md: '1.5rem' } }}>Painel Administrativo</Typography>
                  <Typography variant="body2" color="text.secondary" align="center">Acesse com suas credenciais administrativas para gerenciar usuários e configurações.</Typography>
                </Stack>

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                  <Stack spacing={2} sx={{ width: '100%' }}>
                    <TextField label="Usuário" fullWidth value={state.usuario} onChange={(e) => setField('usuario', e.target.value)} disabled={state.loading} />
                    <TextField label="Senha" fullWidth type={state.showPassword ? 'text' : 'password'} value={state.senha} onChange={(e) => setField('senha', e.target.value)} disabled={state.loading}
                      InputProps={{ endAdornment: (
                        <InputAdornment position="end">
                          <IconButton aria-label="toggle" edge="end" onClick={() => setField('showPassword', !state.showPassword)} tabIndex={-1}>
                            {state.showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ) }}
                    />

                    {captchaImage && (
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                        <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'background.paper' }}>
                          <img src={captchaImage} alt="captcha" style={{ height: 56, display: 'block' }} />
                        </Box>
                        <TextField label="Digite o captcha" value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value)} disabled={state.loading} />
                        <Button variant="text" onClick={() => { setCaptchaAnswer(''); fetchCaptcha(); }} sx={{ whiteSpace: 'nowrap' }}>Atualizar</Button>
                      </Stack>
                    )}

                    {state.error && <Typography color="error" sx={{ mt: 1 }}>{state.error}</Typography>}

                    <Button type="submit" fullWidth variant="contained" size="large" disabled={state.loading} sx={{ height: 48, fontWeight: 600 }}> {state.loading ? 'Entrando...' : 'Entrar'}</Button>

                    <Box sx={{ textAlign: 'center', mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">Versão de desenvolvimento</Typography>
                    </Box>
                  </Stack>
                </Box>
              </CardContent>
            </Box>

            <Box sx={{ width: { xs: '100%', md: '45%' }, display: { xs: 'none', md: 'block' }, bgcolor: 'linear-gradient(135deg, rgba(58,123,213,0.12), rgba(99,102,241,0.08))' }}>
              <Box sx={{ height: '100%', minHeight: 320, background: 'linear-gradient(135deg, rgba(58,123,213,0.12), rgba(99,102,241,0.08))', p: 6, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="h6" fontWeight={700} sx={{ color: 'primary.main', mb: 1 }}>Bem-vindo(a)</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Gerencie usuários, assinaturas e configurações do sistema com segurança.</Typography>
                <Box sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.02)', p: 2, borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">Acesso restrito a administradores. Mantenha suas credenciais seguras.</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Card>
      
    </ThemeProvider>
  );
}
