"use client";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
} from "@mui/material";
import { DirectionsCar } from "@mui/icons-material";
import { ThemeProvider } from "@/theme/ThemeProvider";
import React, { useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import useFormReducer from '@/lib/useFormReducer';
import { extractErrorMessage } from '@/lib/errorUtils';

export default function ForgotPage() {
  type State = {
    email: string;
    loading: boolean;
    error: string | null;
    success: string | null;
    captchaImg: string;
    captchaToken: string;
    captchaAnswer: string;
    captchaLoading: boolean;
  };

  const initialState: State = {
    email: "",
    loading: false,
    error: null,
    success: null,
    captchaImg: "",
    captchaToken: "",
    captchaAnswer: "",
    captchaLoading: false,
  };
  const { state, setField, setLoading, setError, setState: setFormState } = useFormReducer<State>({ ...initialState });

  // Busca captcha ao montar
  useEffect(() => {
    const fetchCaptcha = async () => {
      setField('captchaLoading', true);
      try {
        const res = await axios.get('/api/captcha');
        if (res.data && res.data.png && res.data.token) {
          setFormState({ captchaImg: res.data.png, captchaToken: res.data.token });
        }
      } catch (err: unknown) {
        const msg = extractErrorMessage(err) ?? 'Erro ao carregar captcha';
        setError(msg);
      } finally {
        setField('captchaLoading', false);
      }
    };
    fetchCaptcha();
  }, [setField, setFormState, setError]); // incluir setters para satisfazer o lint

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFormState({ success: null });
    if (!state.captchaAnswer || !state.captchaToken) {
      setError('Preencha o captcha.');
      setLoading(false);
      return;
    }
    try {
      await axios.post(
        "/api/request-password-reset",
        {
          email: state.email,
          captcha_token: state.captchaToken,
          captcha_answer: state.captchaAnswer,
        },
        { headers: { "Content-Type": "application/json" } }
      );
  setFormState({ success: "Se as informações estiverem corretas, você receberá um e-mail para redefinir sua senha." });
    } catch (err: unknown) {
      const msg = extractErrorMessage(err) ?? 'Erro ao enviar e-mail';
      setError(msg);
      // Se captcha falhar, recarrega
      setField('captchaAnswer', '');
      try {
        const res = await axios.get('/api/captcha');
        if (res?.data && res.data.png && res.data.token) {
          setFormState({ captchaImg: res.data.png, captchaToken: res.data.token });
        }
      } catch {
        // ignore
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider>
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #181818 0%, #232323 100%)", p: 2 }}>
        <Card sx={{ maxWidth: 400, width: "100%", backgroundColor: "background.paper", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Avatar sx={{ width: 64, height: 64, margin: "0 auto", backgroundColor: "primary.main", mb: 2 }}>
                <DirectionsCar sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Esqueci a senha
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Informe seu e-mail para receber o link de redefinição
              </Typography>
            </Box>
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                id="email"
                fullWidth
                label="E-mail"
                type="email"
                value={state.email}
                onChange={e => setField('email', e.target.value)}
                sx={{ mb: 3 }}
                disabled={state.loading}
              />
              {/* Captcha */}
              <Box sx={{ mb: 2, textAlign: "center" }}>
                {state.captchaLoading ? (
                  <Typography variant="body2" color="text.secondary">Carregando captcha...</Typography>
                ) : state.captchaImg ? (
                  <Image
                    src={`data:image/png;base64,${state.captchaImg}`}
                    alt="captcha"
                    width={300}
                    height={100}
                    style={{ maxWidth: "100%", marginBottom: 8, borderRadius: 4, background: "#eee" }}
                  />
                ) : (
                  <Typography variant="body2" color="error">Erro ao carregar captcha</Typography>
                )}
                <TextField
                  id="captcha"
                  fullWidth
                  label="Digite o texto da imagem"
                  type="text"
                  value={state.captchaAnswer}
                  onChange={e => setField('captchaAnswer', e.target.value)}
                  sx={{ mt: 1 }}
                  disabled={state.loading || state.captchaLoading}
                />
              </Box>
              {state.error && (
                <Typography color="error" sx={{ mb: 2 }}>
                  {state.error}
                </Typography>
              )}
              {state.success && (
                <Typography color="primary" sx={{ mb: 2 }}>
                  {state.success}
                </Typography>
              )}
              <Button type="submit" fullWidth variant="contained" size="large" sx={{ mb: 2, height: 48, fontWeight: 600 }} disabled={state.loading}>
                {state.loading ? "Enviando..." : "Enviar"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </ThemeProvider>
  );
}
