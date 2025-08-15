'use client';

import { Box, Card, CardContent, Typography, TextField, Button, Avatar, Link, Divider, IconButton, InputAdornment } from '@mui/material';
import { Stepper, Step, StepLabel } from '@mui/material';
import { DirectionsCar } from '@mui/icons-material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import {ThemeProvider} from '@/theme/ThemeProvider';
import NextLink from "next/link";
import React, { useReducer, useEffect } from 'react';
import axios from 'axios';
import { RegisterResponse } from '../../interfaces/RegisterResponse';
import { UsuarioRegisterPayload } from '../../interfaces/UsuarioRegisterPayload';

export default function RegisterPage() {
  const [activeStep, setActiveStep] = React.useState(0);
  const steps = ['Dados Pessoais', 'Endereço', 'Segurança'];
  type State = {
    nome_usuario: string;
    email: string;
    senha: string;
    confirmSenha: string;
    nome_completo: string;
    telefone: string;
    cpfcnpj: string;
    address: string;
    address_number: string;
    complement: string;
    postal_code: string;
    province: string;
    city: string;
    loading: boolean;
    error: string | null;
    success: string | null;
    showPassword: boolean;
    captchaImg: string;
    captchaToken: string;
    captchaAnswer: string;
    captchaLoading: boolean;
  };

  type Action =
  | { type: 'SET_NOME_USUARIO'; payload: string }
  | { type: 'SET_EMAIL'; payload: string }
  | { type: 'SET_SENHA'; payload: string }
  | { type: 'SET_CONFIRM_SENHA'; payload: string }
  | { type: 'SET_NOME_COMPLETO'; payload: string }
  | { type: 'SET_TELEFONE'; payload: string }
  | { type: 'SET_CPFCNPJ'; payload: string }
  | { type: 'SET_ADDRESS'; payload: string }
  | { type: 'SET_ADDRESS_NUMBER'; payload: string }
  | { type: 'SET_COMPLEMENT'; payload: string }
  | { type: 'SET_POSTAL_CODE'; payload: string }
  | { type: 'SET_PROVINCE'; payload: string }
  | { type: 'SET_CITY'; payload: string }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_SUCCESS'; payload: string | null }
    | { type: 'SET_SHOW_PASSWORD'; payload: boolean }
    | { type: 'SET_CAPTCHA_IMG'; payload: string }
    | { type: 'SET_CAPTCHA_TOKEN'; payload: string }
    | { type: 'SET_CAPTCHA_ANSWER'; payload: string }
    | { type: 'SET_CAPTCHA_LOADING'; payload: boolean };

  const initialState: State = {
    nome_usuario: '',
    email: '',
    senha: '',
    confirmSenha: '',
    nome_completo: '',
    telefone: '',
    cpfcnpj: '',
    address: '',
    address_number: '',
    complement: '',
    postal_code: '',
    province: '',
    city: '',
    loading: false,
    error: null,
    success: null,
    showPassword: false,
    captchaImg: '',
    captchaToken: '',
    captchaAnswer: '',
    captchaLoading: false,
  };

  function reducer(state: State, action: Action): State {
    switch (action.type) {
      case 'SET_NOME_USUARIO':
        return { ...state, nome_usuario: action.payload };
      case 'SET_EMAIL':
        return { ...state, email: action.payload };
      case 'SET_SENHA':
        return { ...state, senha: action.payload };
      case 'SET_CONFIRM_SENHA':
        return { ...state, confirmSenha: action.payload };
      case 'SET_NOME_COMPLETO':
        return { ...state, nome_completo: action.payload };
      case 'SET_TELEFONE':
        return { ...state, telefone: action.payload };
      case 'SET_CPFCNPJ':
        return { ...state, cpfcnpj: action.payload };
      case 'SET_ADDRESS':
        return { ...state, address: action.payload };
      case 'SET_ADDRESS':
        return { ...state, address: action.payload };
      case 'SET_ADDRESS_NUMBER':
        return { ...state, address_number: action.payload };
      case 'SET_COMPLEMENT':
        return { ...state, complement: action.payload };
      case 'SET_POSTAL_CODE':
        return { ...state, postal_code: action.payload };
      case 'SET_PROVINCE':
        return { ...state, province: action.payload };
      case 'SET_CITY':
        return { ...state, city: action.payload };
      case 'SET_LOADING':
        return { ...state, loading: action.payload };
      case 'SET_ERROR':
        return { ...state, error: action.payload };
      case 'SET_SUCCESS':
        return { ...state, success: action.payload };
      case 'SET_SHOW_PASSWORD':
        return { ...state, showPassword: action.payload };
      case 'SET_CAPTCHA_IMG':
        return { ...state, captchaImg: action.payload };
      case 'SET_CAPTCHA_TOKEN':
        return { ...state, captchaToken: action.payload };
      case 'SET_CAPTCHA_ANSWER':
        return { ...state, captchaAnswer: action.payload };
      case 'SET_CAPTCHA_LOADING':
        return { ...state, captchaLoading: action.payload };
      default:
        return state;
    }
  }
  // Busca captcha ao montar
  useEffect(() => {
    const fetchCaptcha = async () => {
      dispatch({ type: 'SET_CAPTCHA_LOADING', payload: true });
      try {
        const res = await axios.get('/api/captcha');
        if (res.data && res.data.png && res.data.token) {
          dispatch({ type: 'SET_CAPTCHA_IMG', payload: res.data.png });
          dispatch({ type: 'SET_CAPTCHA_TOKEN', payload: res.data.token });
        }
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar captcha' });
      } finally {
        dispatch({ type: 'SET_CAPTCHA_LOADING', payload: false });
      }
    };
    fetchCaptcha();
  }, []);

  const [state, dispatch] = useReducer(reducer, initialState);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_SUCCESS', payload: null });
    if (state.senha !== state.confirmSenha) {
      dispatch({ type: 'SET_ERROR', payload: 'As senhas não conferem.' });
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    if (!state.captchaAnswer || !state.captchaToken) {
      dispatch({ type: 'SET_ERROR', payload: 'Preencha o captcha.' });
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    try {
      const payload: UsuarioRegisterPayload = {
        nome_usuario: state.nome_usuario,
        email: state.email,
        senha: state.senha,
        nome_completo: state.nome_completo || undefined,
        telefone: state.telefone || undefined,
  cpfcnpj: state.cpfcnpj || undefined,
        address: state.address,
        address_number: state.address_number,
        complement: state.complement,
        postal_code: state.postal_code,
        province: state.province,
        city: state.city,
        captcha_token: state.captchaToken,
        captcha_answer: state.captchaAnswer,
      };
      const response = await axios.post<RegisterResponse>(
        '/api/register',
        payload,
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
      const data = response.data;
      if (data && data.status === 'ok' && data.id) {
        // Chama o endpoint de assinatura
        const assinaturaRes = await axios.post('/api/assinatura/criar', {
          id_usuario: data.id
        });
        const valor = assinaturaRes.data.valor_assinatura || '';
        const url = assinaturaRes.data.payment_url || '';
        // Redireciona para página intermediária, incluindo id_usuario
        window.location.href = `/assinatura?id_usuario=${encodeURIComponent(data.id)}`;
        return;
      }
      if (data && data.mensagem) {
        dispatch({ type: 'SET_ERROR', payload: data.mensagem });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Erro ao cadastrar.' });
      }
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: err.response?.data?.mensagem || err.message || 'Erro ao cadastrar' });
      // Se captcha falhar, recarrega
      dispatch({ type: 'SET_CAPTCHA_ANSWER', payload: '' });
      try {
        const res = await axios.get('/api/captcha');
        if (res.data && res.data.png && res.data.token) {
          dispatch({ type: 'SET_CAPTCHA_IMG', payload: res.data.png });
          dispatch({ type: 'SET_CAPTCHA_TOKEN', payload: res.data.token });
        }
      } catch {}
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <ThemeProvider>
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #181818 0%, #232323 100%)', p: 2 }}>
        <Card sx={{ maxWidth: 400, width: '100%', backgroundColor: 'background.paper', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Avatar sx={{ width: 64, height: 64, margin: '0 auto', backgroundColor: 'primary.main', mb: 2 }}>
                <DirectionsCar sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Cadastro
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Crie sua conta para acessar o sistema
              </Typography>
            </Box>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            <Box component="form" onSubmit={handleSubmit}>
              {activeStep === 0 && (
                <>
                  <TextField id="nome_usuario" fullWidth label="Nome de usuário" type="text" value={state.nome_usuario} onChange={e => dispatch({ type: 'SET_NOME_USUARIO', payload: e.target.value })} sx={{ mb: 2 }} disabled={state.loading} />
                  <TextField id="email" fullWidth label="E-mail" type="email" value={state.email} onChange={e => dispatch({ type: 'SET_EMAIL', payload: e.target.value })} sx={{ mb: 2 }} disabled={state.loading} />
                  <TextField id="nome_completo" fullWidth label="Nome completo" type="text" value={state.nome_completo} onChange={e => dispatch({ type: 'SET_NOME_COMPLETO', payload: e.target.value })} sx={{ mb: 2 }} disabled={state.loading} />
                  <TextField id="telefone" fullWidth label="Telefone" type="text" value={state.telefone} onChange={e => dispatch({ type: 'SET_TELEFONE', payload: e.target.value })} sx={{ mb: 2 }} disabled={state.loading} />
                  <TextField id="cpfcnpj" fullWidth label="CPF ou CNPJ" type="text" value={state.cpfcnpj} onChange={e => dispatch({ type: 'SET_CPFCNPJ', payload: e.target.value })} sx={{ mb: 2 }} disabled={state.loading} />
                  {/* Campo data_inicio_atividade removido */}
                  <Button fullWidth variant="contained" sx={{ mt: 2, height: 48, fontWeight: 600 }} onClick={() => setActiveStep(1)} disabled={state.loading}>Próxima etapa</Button>
                </>
              )}
              {activeStep === 1 && (
                <>
                  <TextField id="postal_code" fullWidth label="CEP" type="text" value={state.postal_code} onChange={async e => {
                    const cep = e.target.value.replace(/\D/g, '');
                    dispatch({ type: 'SET_POSTAL_CODE', payload: cep });
                    if (cep.length === 8) {
                      try {
                        const res = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
                        if (!res.data.erro) {
                          dispatch({ type: 'SET_ADDRESS', payload: res.data.logradouro || '' });
                          dispatch({ type: 'SET_PROVINCE', payload: res.data.bairro || '' });
                          dispatch({ type: 'SET_CITY', payload: res.data.localidade || '' });
                        }
                      } catch {}
                    }
                  }} sx={{ mb: 2 }} disabled={state.loading} />
                  <TextField id="address" fullWidth label="Endereço" type="text" value={state.address} onChange={e => dispatch({ type: 'SET_ADDRESS', payload: e.target.value })} sx={{ mb: 2 }} disabled={state.loading} />
                  <TextField id="address_number" fullWidth label="Número" type="text" value={state.address_number} onChange={e => dispatch({ type: 'SET_ADDRESS_NUMBER', payload: e.target.value })} sx={{ mb: 2 }} disabled={state.loading} />
                  <TextField id="complement" fullWidth label="Complemento" type="text" value={state.complement} onChange={e => dispatch({ type: 'SET_COMPLEMENT', payload: e.target.value })} sx={{ mb: 2 }} disabled={state.loading} />
                  <TextField id="province" fullWidth label="Bairro" type="text" value={state.province} onChange={e => dispatch({ type: 'SET_PROVINCE', payload: e.target.value })} sx={{ mb: 2 }} disabled={state.loading} />
                  <TextField id="city" fullWidth label="Cidade" type="text" value={state.city} onChange={e => dispatch({ type: 'SET_CITY', payload: e.target.value })} sx={{ mb: 2 }} disabled={state.loading} />
                  <Button fullWidth variant="contained" sx={{ mt: 2, height: 48, fontWeight: 600 }} onClick={() => setActiveStep(2)} disabled={state.loading}>Próxima etapa</Button>
                  <Button fullWidth variant="outlined" sx={{ mb: 2, height: 48, fontWeight: 600 }} onClick={() => setActiveStep(0)} disabled={state.loading}>Voltar</Button>
                </>
              )}
              {activeStep === 2 && (
                <>
                  <TextField id="senha" fullWidth label="Senha" type={state.showPassword ? 'text' : 'password'} value={state.senha} onChange={e => dispatch({ type: 'SET_SENHA', payload: e.target.value })} sx={{ mb: 2 }} disabled={state.loading} InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton aria-label={state.showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => dispatch({ type: 'SET_SHOW_PASSWORD', payload: !state.showPassword })} edge="end" tabIndex={-1}>{state.showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>) }} />
                  <TextField id="confirmSenha" fullWidth label="Confirme a senha" type={state.showPassword ? 'text' : 'password'} value={state.confirmSenha} onChange={e => dispatch({ type: 'SET_CONFIRM_SENHA', payload: e.target.value })} sx={{ mb: 3 }} disabled={state.loading} />
                  {/* Captcha */}
                  <Box sx={{ mb: 2, textAlign: 'center' }}>
                    {state.captchaLoading ? (
                      <Typography variant="body2" color="text.secondary">Carregando captcha...</Typography>
                    ) : state.captchaImg ? (
                      <img src={`data:image/png;base64,${state.captchaImg}`} alt="captcha" style={{ maxWidth: '100%', marginBottom: 8, borderRadius: 4, background: '#eee' }} />
                    ) : (
                      <Typography variant="body2" color="error">Erro ao carregar captcha</Typography>
                    )}
                    <TextField id="captcha" fullWidth label="Digite o texto da imagem" type="text" value={state.captchaAnswer} onChange={e => dispatch({ type: 'SET_CAPTCHA_ANSWER', payload: e.target.value })} sx={{ mt: 1 }} disabled={state.loading || state.captchaLoading} />
                  </Box>
                  {state.error && (<Typography color="error" sx={{ mb: 2 }}>{state.error}</Typography>)}
                  {state.success && (<Typography color="primary" sx={{ mb: 2 }}>{state.success}</Typography>)}
                  <Button type="submit" fullWidth variant="contained" size="large" sx={{ mb: 2, height: 48, fontWeight: 600 }} disabled={state.loading}>{state.loading ? 'Cadastrando...' : 'Cadastrar'}</Button>
                  <Button fullWidth variant="outlined" sx={{ mb: 2, height: 48, fontWeight: 600 }} onClick={() => setActiveStep(1)} disabled={state.loading}>Voltar</Button>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Já tem uma conta?{' '}<NextLink href="/login" style={{ fontWeight: 600, textDecoration: "underline", cursor: "pointer", color: "#1976d2" }}>Entrar</NextLink></Typography>
                  </Box>
                </>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </ThemeProvider>
  );
}
