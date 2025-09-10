"use client";
import React, { useEffect, useState } from "react";
import useFormReducer from '@/lib/useFormReducer';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box, Stack, CircularProgress, Typography, IconButton, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import axios from '@/utils/axiosConfig';
import ClearIcon from "@mui/icons-material/Clear";
import { extractErrorMessage } from '@/lib/errorUtils';

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
  const { state, setField, setLoading, setError, setState: setFormState } = useFormReducer({
    email: initialEmail ?? '',
    endereco: initialEndereco ?? {},
  });
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");

  const email = String(state.email ?? '');
  const endereco = (state.endereco ?? {}) as Endereco;
  const loading = Boolean(state.loading);
  const error = String(state.error ?? "");

  useEffect(() => {
    setFormState({ email: initialEmail ?? '', endereco: initialEndereco ?? {} });
    setError(null);
    setCepError("");
  }, [initialEmail, initialEndereco, open, setFormState, setError]);

  

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
      const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!resp.ok) {
        setCepError('Falha ao buscar CEP. Tente novamente.');
        return;
      }
      const data = await resp.json();
      if (data.erro) {
        setCepError("CEP não encontrado.");
      } else {
        setFormState({ endereco: { ...endereco, rua: data.logradouro || endereco.rua, complemento: data.complemento || endereco.complemento, cidade: data.localidade || endereco.cidade, estado: data.uf || endereco.estado, cep } });
      }
    } catch (e) {
      console.error('Erro ao consultar ViaCEP:', e);
      setCepError("Falha ao buscar CEP. Tente novamente.");
    } finally {
      setCepLoading(false);
    }
  }

  function clearEndereco() {
    setFormState({ endereco: {} });
    setCepError("");
  }

  async function handleSave() {
    setError(null);
    if (!validEmail(email)) {
      setError("Informe um email válido.");
      return;
    }
    setLoading(true);
    try {
      // construir payload somente com campos alterados
  const payload: { email?: string; endereco?: Partial<Endereco> } = {};
      if (email !== (initialEmail ?? "")) payload.email = email;

  const enderecoPayload: Partial<Endereco> = {};
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
    } catch (err: unknown) {
      // tratar erros específicos retornados pelo backend
      const extracted = extractErrorMessage(err);

      let status: number | undefined = undefined;
      let data: unknown = undefined;
      try {
        if (err && typeof err === 'object') {
          const respRaw = (err as Record<string, unknown>)['response'] as unknown;
          if (respRaw && typeof respRaw === 'object') {
            status = (respRaw as Record<string, unknown>)['status'] as number | undefined;
            data = (respRaw as Record<string, unknown>)['data'] as unknown;
          }
        }
      } catch {
        // ignore
      }
      if (status === 400) {
        setError(typeof data === "string" ? data : extracted ?? "Entrada inválida.");
      } else if (status === 401) {
        setError("Você precisa estar autenticado para editar o perfil.");
        console.warn("Erro 401: Não autenticado. Verifique o token ou sessão do usuário.");
      } else if (status === 409) {
        setError(typeof data === "string" ? data : extracted ?? "Email já em uso.");
      } else {
        setError(extracted ?? "Não foi possível salvar. Tente novamente mais tarde.");
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
            onChange={(e) => setField('email', e.target.value)}
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
              onChange={(e) => setField('endereco', { ...endereco, cep: e.target.value })}
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
            onChange={(e) => setField('endereco', { ...endereco, rua: e.target.value })}
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
              onChange={(e) => setField('endereco', { ...endereco, cidade: e.target.value })}
              sx={{ flex: 1 }}
              disabled={loading}
            />

            <FormControl sx={{ width: { xs: "100%", sm: 140 } }}>
              <InputLabel id="estado-label">Estado</InputLabel>
              <Select
                labelId="estado-label"
                label="Estado"
                value={endereco.estado ?? ""}
                onChange={(e) => setField('endereco', { ...endereco, estado: e.target.value })}
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
              onChange={(e) => setField('endereco', { ...endereco, numero: e.target.value })}
              sx={{ flex: 1 }}
              disabled={loading}
            />
            <TextField
              label="Complemento"
              value={endereco.complemento ?? ""}
              onChange={(e) => setField('endereco', { ...endereco, complemento: e.target.value })}
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
