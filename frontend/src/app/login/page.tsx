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
import Divider from "@mui/material/Divider";
import NextLink from "next/link";
import { DirectionsCar, Visibility, VisibilityOff } from "@mui/icons-material";
import ThemeProvider from "../../context/ThemeProvider";
import React, { useReducer } from "react";
import axios from "axios";

type State = {
  usuario: string;
  senha: string;
  loading: boolean;
  error: string | null;
  showPassword: boolean;
};

type Action =
  | { type: "SET_USUARIO"; payload: string }
  | { type: "SET_SENHA"; payload: string }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_SHOW_PASSWORD"; payload: boolean };

const initialState: State = {
  usuario: "",
  senha: "",
  loading: false,
  error: null,
  showPassword: false,
};

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

export default function LoginPage() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });
    try {
      const response = await axios.post(
        "/api/login",
        {
          usuario: state.usuario,
          senha: state.senha,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      const res = response.data;
      if (res.token) {
        localStorage.setItem("token", res.token);
        window.location.href = "/";
      } else {
        dispatch({
          type: "SET_ERROR",
          payload: res.message || "Erro ao logar",
        });
      }
    } catch (err: any) {
      dispatch({
        type: "SET_ERROR",
        payload: err.response?.data?.message || err.message || "Erro ao logar",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  return (
    <ThemeProvider>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #181818 0%, #232323 100%)",
          p: 2,
        }}
      >
        <Card
          sx={{
            maxWidth: 400,
            width: "100%",
            backgroundColor: "background.paper",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}
        >
          <CardContent sx={{ p: 4 }}>
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
              <Typography variant="body2" color="text.secondary">
                Sistema financeiro para motoristas de aplicativo
              </Typography>
            </Box>
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                id="usuario"
                fullWidth
                label="E-mail ou usuário"
                type="text"
                value={state.usuario}
                onChange={(e) =>
                  dispatch({ type: "SET_USUARIO", payload: e.target.value })
                }
                sx={{ mb: 2 }}
                disabled={state.loading}
              />
              <TextField
                id="senha"
                fullWidth
                label="Senha"
                type={state.showPassword ? "text" : "password"}
                value={state.senha}
                onChange={(e) =>
                  dispatch({ type: "SET_SENHA", payload: e.target.value })
                }
                sx={{ mb: 3 }}
                disabled={state.loading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={
                          state.showPassword ? "Ocultar senha" : "Mostrar senha"
                        }
                        onClick={() =>
                          dispatch({
                            type: "SET_SHOW_PASSWORD",
                            payload: !state.showPassword,
                          })
                        }
                        edge="end"
                        tabIndex={-1}
                      >
                        {state.showPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              {state.error && (
                <Typography color="error" sx={{ mb: 2 }}>
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
              <Box sx={{ textAlign: "center", mb: 2 }}>
                <NextLink href="/forgot" style={{ fontSize: "0.875rem", textDecoration: "underline", cursor: "pointer", color: "#1976d2" }}>
                  Esqueceu sua senha?
                </NextLink>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Não tem uma conta?{" "}
                  <NextLink href="/register" style={{ fontWeight: 600, textDecoration: "underline", cursor: "pointer", color: "#1976d2" }}>
                    Cadastre-se
                  </NextLink>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </ThemeProvider>
  );
}
