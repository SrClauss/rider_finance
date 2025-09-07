"use client";

import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Divider,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Stepper, Step, StepLabel } from "@mui/material";
import { DirectionsCar } from "@mui/icons-material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { ThemeProvider } from "@/theme/ThemeProvider";
import NextLink from "next/link";
import Image from "next/image";
import React, { useEffect } from "react";
import axios from "axios";
import useFormReducer from "@/lib/useFormReducer";
import { extractErrorMessage } from "@/lib/errorUtils";
import { RegisterResponse } from "../../interfaces/RegisterResponse";
import { UsuarioRegisterPayload } from "../../interfaces/UsuarioRegisterPayload";

export default function RegisterPage() {
  const [activeStep, setActiveStep] = React.useState(0);
  const steps = ["Dados Pessoais", "Endereço", "Segurança"];
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
  const initialState: State = {
    nome_usuario: "",
    email: "",
    senha: "",
    confirmSenha: "",
    nome_completo: "",
    telefone: "",
    cpfcnpj: "",
    address: "",
    address_number: "",
    complement: "",
    postal_code: "",
    province: "",
    city: "",
    loading: false,
    error: null,
    success: null,
    showPassword: false,
    captchaImg: "",
    captchaToken: "",
    captchaAnswer: "",
    captchaLoading: false,
  };
  // Busca captcha ao montar
  const {
    state,
    setField,
    setLoading,
    setError,
    setState: setFormState,
  } = useFormReducer<State>({ ...initialState });

  useEffect(() => {
    const fetchCaptcha = async () => {
      setField("captchaLoading", true);
      try {
        const res = await axios.get("/api/captcha");
        if (res.data && res.data.png && res.data.token) {
          setFormState({
            captchaImg: res.data.png,
            captchaToken: res.data.token,
          });
        }
      } catch (err: unknown) {
        const msg = extractErrorMessage(err) ?? "Erro ao carregar captcha";
        setError(msg);
      } finally {
        setField("captchaLoading", false);
      }
    };
    fetchCaptcha();
    // setField and setFormState are stable from hook; ignoring exhaustive-deps to avoid re-run
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFormState({ success: null });
    if (state.senha !== state.confirmSenha) {
      setError("As senhas não conferem.");
      setLoading(false);
      return;
    }
    if (!state.captchaAnswer || !state.captchaToken) {
      setError("Preencha o captcha.");
      setLoading(false);
      return;
    }
    try {
      const payload: UsuarioRegisterPayload = {
        nome_usuario: state.nome_usuario,
        email: state.email,
        senha: state.senha,
        veiculo: "",
        nome_completo: state.nome_completo || "",
        telefone: state.telefone || "",
        cpfcnpj: state.cpfcnpj || "",
        address: state.address || "",
        address_number: state.address_number || "",
        complement: state.complement || "",
        postal_code: state.postal_code || "",
        province: state.province || "",
        city: state.city || "",
        captcha_token: state.captchaToken,
        captcha_answer: state.captchaAnswer,
      };

      const response = await axios.post<RegisterResponse>(
        "/api/register",
        payload,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = response.data;
      if (data && data.status === "ok" && data.id) {
        // Após cadastro bem-sucedido: redireciona para página de assinatura
        // O usuário escolherá os meses e fará o checkout lá
        window.location.href = `/assinatura?id_usuario=${encodeURIComponent(
          data.id
        )}`;
        return;
      }
      if (data && data.mensagem) {
        setError(data.mensagem);
      } else {
        setError("Erro ao cadastrar.");
      }
    } catch (err: unknown) {
      const msg = extractErrorMessage(err) ?? "Erro ao cadastrar";
      setError(String(msg));
      // Se captcha falhar, recarrega
      setField("captchaAnswer", "");
      try {
        const res = await axios.get("/api/captcha");
        if (res.data && res.data.png && res.data.token) {
          setFormState({
            captchaImg: res.data.png,
            captchaToken: res.data.token,
          });
        }
      } catch {}
    } finally {
      setLoading(false);
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
                  <TextField
                    id="nome_usuario"
                    fullWidth
                    label="Nome de usuário"
                    type="text"
                    value={state.nome_usuario}
                    onChange={(e) => setField("nome_usuario", e.target.value)}
                    sx={{ mb: 2 }}
                    disabled={state.loading}
                  />
                  <TextField
                    id="email"
                    fullWidth
                    label="E-mail"
                    type="email"
                    value={state.email}
                    onChange={(e) => setField("email", e.target.value)}
                    sx={{ mb: 2 }}
                    disabled={state.loading}
                  />
                  <TextField
                    id="nome_completo"
                    fullWidth
                    label="Nome completo"
                    type="text"
                    value={state.nome_completo}
                    onChange={(e) => setField("nome_completo", e.target.value)}
                    sx={{ mb: 2 }}
                    disabled={state.loading}
                  />
                  <TextField
                    id="telefone"
                    fullWidth
                    label="Telefone"
                    type="text"
                    value={state.telefone}
                    onChange={(e) => setField("telefone", e.target.value)}
                    sx={{ mb: 2 }}
                    disabled={state.loading}
                  />
                  <TextField
                    id="cpfcnpj"
                    fullWidth
                    label="CPF ou CNPJ"
                    type="text"
                    value={state.cpfcnpj}
                    onChange={(e) => setField("cpfcnpj", e.target.value)}
                    sx={{ mb: 2 }}
                    disabled={state.loading}
                  />
                  {/* Campo data_inicio_atividade removido */}
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{ mt: 2, height: 48, fontWeight: 600 }}
                    onClick={() => setActiveStep(1)}
                    disabled={state.loading}
                  >
                    Próxima etapa
                  </Button>
                </>
              )}
              {activeStep === 1 && (
                <>
                  <TextField
                    id="postal_code"
                    fullWidth
                    label="CEP"
                    type="text"
                    value={state.postal_code}
                    onChange={async (e) => {
                      const cep = e.target.value.replace(/\D/g, "");
                      setField("postal_code", cep);
                      if (cep.length === 8) {
                        try {
                          const res = await axios.get(
                            `https://viacep.com.br/ws/${cep}/json/`
                          );
                          if (!res.data.erro) {
                            setField("address", res.data.logradouro || "");
                            setField("province", res.data.bairro || "");
                            setField("city", res.data.localidade || "");
                          }
                        } catch {}
                      }
                    }}
                    sx={{ mb: 2 }}
                    disabled={state.loading}
                  />
                  <TextField
                    id="address"
                    fullWidth
                    label="Endereço"
                    type="text"
                    value={state.address}
                    onChange={(e) => setField("address", e.target.value)}
                    sx={{ mb: 2 }}
                    disabled={state.loading}
                  />
                  <TextField
                    id="address_number"
                    fullWidth
                    label="Número"
                    type="text"
                    value={state.address_number}
                    onChange={(e) => setField("address_number", e.target.value)}
                    sx={{ mb: 2 }}
                    disabled={state.loading}
                  />
                  <TextField
                    id="complement"
                    fullWidth
                    label="Complemento"
                    type="text"
                    value={state.complement}
                    onChange={(e) => setField("complement", e.target.value)}
                    sx={{ mb: 2 }}
                    disabled={state.loading}
                  />
                  <TextField
                    id="province"
                    fullWidth
                    label="Bairro"
                    type="text"
                    value={state.province}
                    onChange={(e) => setField("province", e.target.value)}
                    sx={{ mb: 2 }}
                    disabled={state.loading}
                  />
                  <TextField
                    id="city"
                    fullWidth
                    label="Cidade"
                    type="text"
                    value={state.city}
                    onChange={(e) => setField("city", e.target.value)}
                    sx={{ mb: 2 }}
                    disabled={state.loading}
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{ mt: 2, height: 48, fontWeight: 600 }}
                    onClick={() => setActiveStep(2)}
                    disabled={state.loading}
                  >
                    Próxima etapa
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{ mb: 2, height: 48, fontWeight: 600 }}
                    onClick={() => setActiveStep(0)}
                    disabled={state.loading}
                  >
                    Voltar
                  </Button>
                </>
              )}
              {activeStep === 2 && (
                <>
                  <TextField
                    id="senha"
                    fullWidth
                    label="Senha"
                    type={state.showPassword ? "text" : "password"}
                    value={state.senha}
                    onChange={(e) => setField("senha", e.target.value)}
                    sx={{ mb: 2 }}
                    disabled={state.loading}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label={
                              state.showPassword
                                ? "Ocultar senha"
                                : "Mostrar senha"
                            }
                            onClick={() =>
                              setField("showPassword", !state.showPassword)
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
                  <TextField
                    id="confirmSenha"
                    fullWidth
                    label="Confirme a senha"
                    type={state.showPassword ? "text" : "password"}
                    value={state.confirmSenha}
                    onChange={(e) => setField("confirmSenha", e.target.value)}
                    sx={{ mb: 3 }}
                    disabled={state.loading}
                  />
                  {/* Captcha */}
                  <Box sx={{ mb: 2, textAlign: "center" }}>
                    {state.captchaLoading ? (
                      <Typography variant="body2" color="text.secondary">
                        Carregando captcha...
                      </Typography>
                    ) : state.captchaImg ? (
                      <Image
                        src={`data:image/png;base64,${state.captchaImg}`}
                        alt="captcha"
                        width={300}
                        height={100}
                        style={{
                          maxWidth: "100%",
                          marginBottom: 8,
                          borderRadius: 4,
                          background: "#eee",
                        }}
                      />
                    ) : (
                      <Typography variant="body2" color="error">
                        Erro ao carregar captcha
                      </Typography>
                    )}
                    <TextField
                      id="captcha"
                      fullWidth
                      label="Digite o texto da imagem"
                      type="text"
                      value={state.captchaAnswer}
                      onChange={(e) =>
                        setField("captchaAnswer", e.target.value)
                      }
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
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    sx={{ mb: 2, height: 48, fontWeight: 600 }}
                    disabled={state.loading}
                  >
                    {state.loading ? "Cadastrando..." : "Cadastrar"}
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{ mb: 2, height: 48, fontWeight: 600 }}
                    onClick={() => setActiveStep(1)}
                    disabled={state.loading}
                  >
                    Voltar
                  </Button>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      Já tem uma conta?{" "}
                      <NextLink
                        href="/login"
                        style={{
                          fontWeight: 600,
                          textDecoration: "underline",
                          cursor: "pointer",
                          color: "#1976d2",
                        }}
                      >
                        Entrar
                      </NextLink>
                    </Typography>
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
