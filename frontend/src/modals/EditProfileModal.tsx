"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box, Stack, CircularProgress, Typography, IconButton, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import axios from "axios";
import ClearIcon from "@mui/icons-material/Clear";

type Endereco = {
  rua?: string;
  numero?: string;
  complemento?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
};

type Props = {
  open: boolean;
  initialEmail?: string;
  initialEndereco?: Endereco | null;
  onClose: () => void;
  onSave: (updated: { email?: string; endereco?: Endereco }) => void;
};

const UFs = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

export default function EditProfileModal({ open, initialEmail, initialEndereco, onClose, onSave }: Props) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [endereco, setEndereco] = useState<Endereco>(initialEndereco ?? {});
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [error, setError] = useState("");
  const [cepError, setCepError] = useState("");

  useEffect(() => {
    setEmail(initialEmail ?? "");
    setEndereco(initialEndereco ?? {});
    setError("");
    setCepError("");
  }, [initialEmail, initialEndereco, open]);

  

  function validEmail(e: string) {
    return /\S+@\S+\.\S+/.test(e);
  }

  function sanitizeCep(raw: string) {
    return (raw || "").replace(/[^0-9]/g, "").slice(0, 8);
  }

  async function lookupCep(cepRaw?: string) {
    setCepError("");
    const cep = sanitizeCep(cepRaw ?? endereco.cep ?? "");
    if (!cep || cep.length !== 8) {
      setCepError("CEP inválido. Use 8 dígitos.");
      return;
    }

    setCepLoading(true);
    try {
      const res = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
      const data = res.data;
      if (data.erro) {
        setCepError("CEP não encontrado.");
      } else {
        setEndereco((s) => ({ ...s, rua: data.logradouro || s.rua, complemento: data.complemento || s.complemento, cidade: data.localidade || s.cidade, estado: data.uf || s.estado, cep }));
      }
    } catch (e) {
      setCepError("Falha ao buscar CEP. Tente novamente.");
    } finally {
      setCepLoading(false);
    }
  }

  function clearEndereco() {
    setEndereco({});
    setCepError("");
  }

  async function handleSave() {
    setError("");
    if (!validEmail(email)) {
      setError("Informe um email válido.");
      return;
    }

    setLoading(true);
    try {
      // construir payload somente com campos alterados
      const payload: any = {};
      if (email !== (initialEmail ?? "")) payload.email = email;

      const enderecoPayload: any = {};
      if (endereco.rua) enderecoPayload.rua = endereco.rua;
      if (endereco.numero) enderecoPayload.numero = endereco.numero;
      if (endereco.complemento) enderecoPayload.complemento = endereco.complemento;
      if (endereco.cidade) enderecoPayload.cidade = endereco.cidade;
      if (endereco.estado) enderecoPayload.estado = endereco.estado;
      if (endereco.cep) enderecoPayload.cep = endereco.cep;
      if (Object.keys(enderecoPayload).length > 0) payload.endereco = enderecoPayload;

      const res = await axios.patch("/api/me", payload, { withCredentials: true });
      if (res.status === 200) {
        onSave({ email, endereco });
        onClose();
      }
    } catch (e: any) {
      // tratar erros específicos retornados pelo backend
      const status = e?.response?.status;
      const data = e?.response?.data;
      if (status === 400) {
        setError(typeof data === "string" ? data : "Entrada inválida.");
      } else if (status === 401) {
        setError("Você precisa estar autenticado para editar o perfil.");
      } else if (status === 409) {
        setError(typeof data === "string" ? data : "Email já em uso.");
      } else {
        setError("Não foi possível salvar. Tente novamente mais tarde.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Editar perfil</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            type="email"
            error={!!(email && !validEmail(email))}
            helperText={email && !validEmail(email) ? "Formato de email inválido" : ""}
            disabled={loading}
          />

          <Typography variant="subtitle2">Endereço</Typography>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <TextField
              label="CEP"
              value={endereco.cep ?? ""}
              onChange={(e) => setEndereco((s) => ({ ...s, cep: e.target.value }))}
              onBlur={() => lookupCep()}
              sx={{ width: 160 }}
              disabled={cepLoading || loading}
              inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
              helperText={cepError || ""}
              error={!!cepError}
            />

            <IconButton aria-label="limpar-endereco" onClick={clearEndereco} disabled={loading || cepLoading}>
              <ClearIcon />
            </IconButton>

          </Box>

          <TextField
            label="Rua"
            value={endereco.rua ?? ""}
            onChange={(e) => setEndereco((s) => ({ ...s, rua: e.target.value }))}
            fullWidth
            disabled={loading}
            sx={{
              // no mobile: cada campo em sua linha; em telas maiores, pode compartilhar linha com cidade
              width: "100%",
            }}
          />

          <Box sx={{ display: "flex", gap: 1, flexDirection: { xs: "column", sm: "row" } }}>
            <TextField
              label="Cidade"
              value={endereco.cidade ?? ""}
              onChange={(e) => setEndereco((s) => ({ ...s, cidade: e.target.value }))}
              sx={{ flex: 1 }}
              disabled={loading}
            />

            <FormControl sx={{ width: { xs: "100%", sm: 140 } }}>
              <InputLabel id="estado-label">Estado</InputLabel>
              <Select
                labelId="estado-label"
                label="Estado"
                value={endereco.estado ?? ""}
                onChange={(e) => setEndereco((s) => ({ ...s, estado: e.target.value }))}
                disabled={loading}
              >
                <MenuItem value="">-</MenuItem>
                {UFs.map((uf) => (
                  <MenuItem key={uf} value={uf}>{uf}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              label="Número"
              value={endereco.numero ?? ""}
              onChange={(e) => setEndereco((s) => ({ ...s, numero: e.target.value }))}
              sx={{ flex: 1 }}
              disabled={loading}
            />
            <TextField
              label="Complemento"
              value={endereco.complemento ?? ""}
              onChange={(e) => setEndereco((s) => ({ ...s, complemento: e.target.value }))}
              sx={{ flex: 1 }}
              disabled={loading}
            />
          </Box>

          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}

        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading || cepLoading}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" disabled={loading || cepLoading || !validEmail(email)}>
          {loading ? <CircularProgress size={18} color="inherit" /> : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
