"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Avatar,
  Paper,
  CircularProgress,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Stack,
  Tooltip,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import LoggedLayout from "@/layouts/LoggedLayout";
import EditProfileModal from "@/modals/EditProfileModal";
import { UsuarioMeResponse } from "@/interfaces/UsuarioMeResponse";
import { Configuracao } from "@/interfaces/Configuracao";

export default function PerfilPage() {
  const [usuario, setUsuario] = useState<UsuarioMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [openEdit, setOpenEdit] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [editingConfigs, setEditingConfigs] = useState(false);
  const [projecaoMetodo, setProjecaoMetodo] = useState<string>("media_movel_3");
  const [projecaoPercentualExtremos, setProjecaoPercentualExtremos] = useState<number>(10);
  const [maskMoeda, setMaskMoeda] = useState<string>("brl");
  const [savingConfigs, setSavingConfigs] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get("/api/me", { withCredentials: true });
        if (!mounted) return;
        setUsuario(res.data);
  // prefill configurações
  const cfgs: Configuracao[] = res.data.configuracoes || [];
  const find = (k: string) => cfgs.find((c) => c.chave === k)?.valor;
  const pm = find("projecao_metodo");
  if (pm) setProjecaoMetodo(pm);
  const ppe = find("projecao_percentual_extremos");
  if (ppe) setProjecaoPercentualExtremos(parseInt(ppe, 10) || 10);
  const mm = find("mask_moeda");
  if (mm) setMaskMoeda(mm);
      } catch (e) {
        if (!mounted) return;
        setErro("Erro ao carregar dados do perfil.");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const initials = usuario?.nome_completo
    ? usuario.nome_completo.split(" ").map((n) => n[0]).slice(0, 2).join("")
    : "";

  function formatEndereco(e: any) {
  if (!e) return "Não informado";
  const line1Parts = [];
  if (e.rua) line1Parts.push(e.rua);
  if (e.numero) line1Parts.push(e.numero);
  let line1 = line1Parts.join(", ");
  if (e.complemento) line1 = line1 ? `${line1} ${e.complemento}` : e.complemento;

  const line2 = [e.cidade, e.estado].filter(Boolean).join(" - ");
  const line3 = e.cep ? `CEP ${e.cep}` : "";

  return [line1, line2, line3].filter(Boolean).join("\n");
  }

  async function handleSaveProfile(updated: { email?: string; endereco?: any }) {
    // atualizar localmente (otimista)
    setUsuario((u) => {
      if (!u) return u;
      return { ...u, email: updated.email ?? u.email, endereco: updated.endereco ?? (u as any).endereco } as UsuarioMeResponse;
    });
  setSnackMessage("Perfil atualizado com sucesso");
  setSnackOpen(true);
  }

  return (
    <LoggedLayout>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          p: { xs: 2, sm: 3 },
          bgcolor: "background.default",
          minHeight: "100vh",
        }}
      >
        <Paper
          elevation={6}
          sx={{
            width: { xs: "100%", sm: 640, md: 720 },
            maxWidth: 900,
            p: { xs: 2, sm: 3 },
            bgcolor: "common.black",
            color: "common.white",
            boxShadow: 6,
            borderRadius: 2,
            overflow: "auto",
          }}
        >
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress color="inherit" />
            </Box>
          ) : erro ? (
            <Typography color="error">{erro}</Typography>
          ) : (
            <>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: { xs: 1.5, sm: 2 },
                  mb: { xs: 1.5, sm: 2 },
                  flexDirection: { xs: "column", sm: "row" },
                  textAlign: { xs: "center", sm: "left" },
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: "primary.main",
                    width: { xs: 56, sm: 64 },
                    height: { xs: 56, sm: 64 },
                    fontSize: { xs: 18, sm: 20 },
                  }}
                >
                  {initials}
                </Avatar>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontSize: { xs: "1.05rem", sm: "1.25rem" } }}>
                    {usuario?.nome_completo}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.85, fontSize: { xs: 12, sm: 13 } }}>
                    {usuario?.email}
                  </Typography>
                </Box>

                <Box sx={{ mt: { xs: 1, sm: 0 } }}>
                  <Button variant="contained" color="secondary" size="small">
                    Log out
                  </Button>
                </Box>
              </Box>

              <Accordion sx={{ bgcolor: "transparent", color: "common.white", boxShadow: "none" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "common.white" }} />}>
                  <Typography sx={{ fontSize: { xs: 14, sm: 15 } }}>Perfil</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: { xs: 1, sm: 2 } }}>
                  <Box>
                    <Typography variant="subtitle2">Email</Typography>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                      <Typography variant="body2" sx={{ opacity: 0.85, wordBreak: 'break-all' }}>{usuario?.email ?? "Não informado"}</Typography>
                      <Tooltip title="Editar email e endereço">
                        <IconButton color="inherit" size="small" onClick={() => setOpenEdit(true)} aria-label="editar email e endereço">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>

                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2">Endereço</Typography>
                      <Typography variant="body2" sx={{ opacity: 0.85, whiteSpace: 'pre-line', mt: 0.5 }}>{formatEndereco((usuario as any)?.endereco)}</Typography>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>

              <Accordion sx={{ bgcolor: "transparent", color: "common.white", boxShadow: "none" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "common.white" }} />}>
                  <Typography sx={{ fontSize: { xs: 14, sm: 15 } }}>Configurações</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: { xs: 1, sm: 2 } }}>{/* vazio - implementar depois */}</AccordionDetails>
              </Accordion>

              <Accordion sx={{ bgcolor: "transparent", color: "common.white", boxShadow: "none" }} expanded={editingConfigs} onChange={() => setEditingConfigs((s) => !s)}>
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "common.white" }} />}>
                  <Typography sx={{ fontSize: { xs: 14, sm: 15 } }}>Configurações</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: { xs: 1, sm: 2 } }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle2">Método de projeção</Typography>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                        <FormControl sx={{ minWidth: 220 }}>
                          <InputLabel id="projecao-metodo-label">Método</InputLabel>
                          <Select
                            labelId="projecao-metodo-label"
                            label="Método"
                            value={projecaoMetodo}
                            onChange={(e) => setProjecaoMetodo(e.target.value as string)}
                            sx={{ color: 'text.primary' }}
                          >
                            <MenuItem value="mediana">Mediana</MenuItem>
                            <MenuItem value="media">Média</MenuItem>
                            <MenuItem value="media_movel_3">Média Móvel (3)</MenuItem>
                            <MenuItem value="media_movel_7">Média Móvel (7)</MenuItem>
                            <MenuItem value="media_movel_30">Média Móvel (30)</MenuItem>
                          </Select>
                        </FormControl>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                          Amostra: {projecaoMetodo === 'mediana' ? 'usa mediana dos valores' : projecaoMetodo === 'media' ? 'usa média dos valores' : `média móvel (${projecaoMetodo.split('_').pop()})`}
                        </Typography>
                      </Stack>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2">Percentual para excluir extremos</Typography>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                        <FormControl sx={{ minWidth: 160 }}>
                          <Select value={projecaoPercentualExtremos} onChange={(e) => setProjecaoPercentualExtremos(Number(e.target.value))}>
                            <MenuItem value={5}>5%</MenuItem>
                            <MenuItem value={10}>10%</MenuItem>
                            <MenuItem value={15}>15%</MenuItem>
                            <MenuItem value={20}>20%</MenuItem>
                            <MenuItem value={25}>25%</MenuItem>
                          </Select>
                        </FormControl>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>Exclui os {projecaoPercentualExtremos}% maiores/menores antes da projeção</Typography>
                      </Stack>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2">Máscara de moeda</Typography>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                        <FormControl sx={{ minWidth: 220 }}>
                          <InputLabel id="mask-moeda-label">Máscara</InputLabel>
                          <Select labelId="mask-moeda-label" label="Máscara" value={maskMoeda} onChange={(e) => setMaskMoeda(e.target.value as string)}>
                            <MenuItem value="brl">R$ 1.234,56 (BRL)</MenuItem>
                            <MenuItem value="usd">$1,234.56 (USD)</MenuItem>
                            <MenuItem value="eur">€1.234,56 (EUR)</MenuItem>
                          </Select>
                        </FormControl>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>Exemplo: {maskMoeda === 'brl' ? 'R$ 1.234,56' : maskMoeda === 'usd' ? '$1,234.56' : '€1.234,56'}</Typography>
                      </Stack>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button onClick={() => {
                        // reset to values from usuario.configuracoes
                        const cfgs: Configuracao[] = usuario?.configuracoes || [];
                        const find = (k: string) => cfgs.find((c) => c.chave === k)?.valor;
                        const pm = find('projecao_metodo'); if (pm) setProjecaoMetodo(pm);
                        const ppe = find('projecao_percentual_extremos'); if (ppe) setProjecaoPercentualExtremos(parseInt(ppe,10) || 10);
                        const mm = find('mask_moeda'); if (mm) setMaskMoeda(mm);
                        setEditingConfigs(false);
                      }}>Cancelar</Button>
                      <Button variant="contained" disabled={savingConfigs} onClick={async () => {
                        setSavingConfigs(true);
                        try {
                          // salvar apenas as configs alteradas
                          const payload: any = { configuracoes: [
                            { chave: 'projecao_metodo', valor: projecaoMetodo },
                            { chave: 'projecao_percentual_extremos', valor: String(projecaoPercentualExtremos) },
                            { chave: 'mask_moeda', valor: maskMoeda },
                          ] };
                          await axios.patch('/api/me', payload, { withCredentials: true });
                          // atualizar localmente: aplicar/atualizar as 3 chaves no array de configuracoes
                          setUsuario((u) => {
                            if (!u) return u;
                            const prev = u.configuracoes || [];
                            const upsert = (chave: string, valor: string) => {
                              const idx = prev.findIndex((p:any) => p.chave === chave);
                              if (idx >= 0) {
                                prev[idx] = { ...prev[idx], valor };
                              } else {
                                prev.push({ id: 'new-'+chave, id_usuario: u.id, chave, valor, eh_publica: false, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() } as any);
                              }
                            };
                            upsert('projecao_metodo', projecaoMetodo);
                            upsert('projecao_percentual_extremos', String(projecaoPercentualExtremos));
                            upsert('mask_moeda', maskMoeda);
                            return { ...u, configuracoes: prev } as UsuarioMeResponse;
                          });
                          setSnackMessage('Configurações atualizadas');
                          setSnackOpen(true);
                          setEditingConfigs(false);
                        } catch (e) {
                          setSnackMessage('Falha ao salvar configurações');
                          setSnackOpen(true);
                        } finally {
                          setSavingConfigs(false);
                        }
                      }}>{savingConfigs ? 'Salvando...' : 'Salvar configurações'}</Button>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>

              <Accordion sx={{ bgcolor: "transparent", color: "common.white", boxShadow: "none" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "common.white" }} />}>
                  <Typography sx={{ fontSize: { xs: 14, sm: 15 } }}>Assinatura</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: { xs: 1, sm: 2 } }}>{/* vazio - implementar depois */}</AccordionDetails>
              </Accordion>

              <Box sx={{ height: { xs: 28, sm: 16 } }} />
            </>
          )}
        </Paper>
      </Box>

      <EditProfileModal
        open={openEdit}
        initialEmail={usuario?.email}
        initialEndereco={(usuario as any)?.endereco ?? null}
        onClose={() => setOpenEdit(false)}
        onSave={handleSaveProfile}
      />
      <Snackbar open={snackOpen} autoHideDuration={3000} onClose={() => setSnackOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackOpen(false)} severity="success" sx={{ width: '100%' }}>
          {snackMessage}
        </Alert>
      </Snackbar>
    </LoggedLayout>
  );
}
