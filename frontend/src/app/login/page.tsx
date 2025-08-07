/* Migrado de rider_finance */
'use client'

import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Avatar,
  Alert,
  Link,
  Divider,
  InputAdornment,
  IconButton,
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  DirectionsCar,
} from '@mui/icons-material'
import { useTitle } from '@/context/TitleContext'

export default function LoginPage() {
  
  const { setTitle } = useTitle();
  setTitle("Login");

  type FormState = {
    email: string;
    password: string;
  };

  type FormAction =
    | { type: "SET_FIELD"; field: keyof FormState; value: string }
    | { type: "RESET" };

  function formReducer(state: FormState, action: FormAction): FormState {
    switch (action.type) {
      case "SET_FIELD":
        return { ...state, [action.field]: action.value };
      case "RESET":
        return { email: "", password: "" };
      default:
        return state;
    }
  }

  const [formData, dispatchForm] = React.useReducer(formReducer, {
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatchForm({ type: "SET_FIELD", field, value: e.target.value });
    setError("");
  } 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Usa o proxy reverso do nginx: /api/ -> backend FastAPI
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          login: formData.email,
          senha: formData.password,
        }),
      });

      if (response.status === 401) {
        setError('Usuário ou senha inválidos.');
        return;
      }

      if (!response.ok) {
        setError('Erro ao fazer login. Tente novamente.');
        return;
      }

      const data = await response.json();
      const user = data?.data?.user;
      const tokens = data?.data?.tokens;
      if (!user || !tokens?.access_token) {
        setError('Resposta inválida do servidor.');
        return;
      }

      // Salva dados localmente, sem contexto global
      localStorage.setItem('authToken', tokens.access_token);
      localStorage.setItem('userData', JSON.stringify(user));
      // Redirecionar para dashboard ou página inicial
      window.location.href = '/';
    } catch (err) {
      setError('Erro ao fazer login. Verifique sua conexão.');
    } finally {
      setIsLoading(false);
    }
  } 

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
        padding: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 400,
          width: '100%',
          backgroundColor: 'background.paper',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                margin: '0 auto',
                backgroundColor: 'primary.main',
                mb: 2,
              }}
            >
              <DirectionsCar sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Rider Finance
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sistema financeiro para motoristas de aplicativo
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="E-mail"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              required
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange('password')}
              required
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{
                mb: 2,
                height: 48,
                fontWeight: 600,
              }}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>

            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Link href="#" underline="hover" sx={{ fontSize: '0.875rem' }}>
                Esqueceu sua senha?
              </Link>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Não tem uma conta?{' '}
                <Link href="#" fontWeight={600} underline="hover">
                  Cadastre-se
                </Link>
              </Typography>
            </Box>
          </Box>

          {/* Demo Info */}
          <Box
            sx={{
              mt: 3,
              p: 2,
              backgroundColor: 'success.light',
              borderRadius: 1,
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" color="success.dark" fontWeight={600}>
              DEMO: Use qualquer e-mail e senha para testar
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
