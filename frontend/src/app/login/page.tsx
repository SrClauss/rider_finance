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
import axios, { AxiosResponse } from 'axios'
import { LoginResponse } from '@/interfaces/authInterfaces'

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post('/api/login', {
        usuario: formData.email, // ou formData.usuario se for campo separado
        senha: formData.password,
      });
      const data = response.data as { message: string; token: string | null };
      if (response.status === 200 && data.token) {
        // Sucesso no login
        setIsLoading(false);
        // Salva o token no cookie
        document.cookie = `authToken=${data.token}; path=/`;
        window.location.href = '/'; // Redireciona para a página inicial
      } else {
        setError(data.message || "Login falhou. Verifique suas credenciais.");
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao fazer login");
      setIsLoading(false);
      return;
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
        
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
