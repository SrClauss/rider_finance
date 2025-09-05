"use client";

import React, { useEffect, useState } from 'react';
import Toast from '@/components/ui/Toast';
import axios from 'axios';
import { Box, Card, CardContent, Typography, Button, Divider, TextField } from '@mui/material';
import { ConfiguracoesSistema } from '../../interfaces/ConfiguracoesSistema';
import { extractErrorMessage } from '@/lib/errorUtils';
import {ThemeProvider} from '@/theme/ThemeProvider';
import { UsuarioRegisterPayload } from '@/interfaces/UsuarioRegisterPayload';
import AssinaturaModal from '@/modals/AssinaturaModal';
import useFormReducer from '@/lib/useFormReducer';

export default function RenovacaoCheckout() {
  const [isClient, setIsClient] = useState(false);
  const { state, setField, setLoading, setError } = useFormReducer<{
    valor: string;
    modalOpen: boolean;
    meses: number;
    idUsuario: string;
  }>({ valor: '', modalOpen: false, meses: 1, idUsuario: '' });
  const [usuario, setUsuario] = useState<UsuarioRegisterPayload | null>(null);
  const [assinatura] = useState<{ periodo_fim?: string } | null>(null);
  const [diasRestantes] = useState<number | null>(null);
  const [toast, setToast] = useState<{ open: boolean; severity?: 'error' | 'success' | 'info' | 'warning'; message: string }>({ open: false, severity: 'info', message: '' });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setField('idUsuario', params.get('id_usuario') || '');
  }, [setField]);

  useEffect(() => {
    setIsClient(true);
    setLoading(true);
    if (!state.idUsuario) {
      setLoading(false);
      return;
    }
  let mounted = true;
    (async () => {
      try {
        const cfgRes = await axios.get<ConfiguracoesSistema>(`/api/checkout-info?id_usuario=${state.idUsuario}`);
        if (!mounted) return;
        setField('valor', cfgRes.data.valor ?? '');
      } catch {
        if (!mounted) return;
        setError('Erro ao buscar configurações do sistema');
      }
      try {
        const userRes = await axios.get(`/api/usuario/${state.idUsuario}`);
        const usuarioData = {
          id: userRes.data.id,
          nome_usuario: userRes.data.nome_usuario,
          email: userRes.data.email,
          senha: userRes.data.senha,
          nome_completo: userRes.data.nome_completo,
          telefone: userRes.data.telefone,
          veiculo: userRes.data.veiculo,
          data_inicio_atividade: userRes.data.data_inicio_atividade,
          eh_pago: userRes.data.eh_pago,
          id_pagamento: userRes.data.id_pagamento,
          metodo_pagamento: userRes.data.metodo_pagamento,
          status_pagamento: userRes.data.status_pagamento,
          tipo_assinatura: userRes.data.tipo_assinatura,
          trial_termina_em: userRes.data.trial_termina_em,
          criado_em: userRes.data.criado_em,
          atualizado_em: userRes.data.atualizado_em,
          ultima_tentativa_redefinicao: userRes.data.ultima_tentativa_redefinicao,
          address: userRes.data.address,
          address_number: userRes.data.address_number,
          complement: userRes.data.complement,
          postal_code: userRes.data.postal_code,
          province: userRes.data.province,
          city: userRes.data.city,
          cpfcnpj: userRes.data.cpfcnpj,
          captcha_token: userRes.data.captcha_token,
          captcha_answer: userRes.data.captcha_answer
        };
        if (!mounted) return;
        setUsuario(usuarioData);
        } catch {
        // ignore
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [state.idUsuario, setField, setLoading, setError, setUsuario, setIsClient]);

  const handleRenew = async () => {
    if (!usuario) {
      setError('Usuário não encontrado. Por favor, recarregue a página.');
      return;
    }
    try {
      const res = await axios.post('/api/assinatura/checkout', {
        id_usuario: state.idUsuario,
        valor: state.valor,
        meses: state.meses,
        nome: usuario.nome_completo,
        cpf: usuario.cpfcnpj || '',
        email: usuario.email || '',
        telefone: usuario.telefone || '',
        endereco: usuario.address || '',
        numero: usuario.address_number || '',
        complemento: usuario.complement || '',
        cep: usuario.postal_code || '',
        bairro: usuario.province || '',
        cidade: usuario.city || ''
      });
      const link = res.data?.link || res.data?.payment_url || res.data?.paymentUrl || res.data?.url;
      if (link) {
        window.location.href = link;
      } else {
        const msg = res.data?.mensagem || res.data?.message || 'Erro ao criar checkout (sem link)';
        setError(msg);
        console.error('Checkout sem link:', res.data);
  setToast({ open: true, severity: 'error', message: msg });
      }
    } catch (err: unknown) {
      console.error('Erro ao criar checkout:', err);
      const extracted = extractErrorMessage(err);
      
      let respData: unknown = undefined;
      try {
        if (err && typeof err === 'object') {
          const respRaw = (err as Record<string, unknown>)['response'] as unknown;
          if (respRaw && typeof respRaw === 'object') {
            respData = (respRaw as Record<string, unknown>)['data'] as unknown;
          }
        }
      } catch {
        // ignore
      }
      const resp = respData as { mensagem?: string; message?: string } | undefined;
      const msg = resp?.mensagem || resp?.message || extracted || 'Erro ao criar checkout';
  setError(String(msg));
    }
  };

  if (!isClient) return null;
  if (state.loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #181818 0%, #232323 100%)', p: 2 }}>
        <Card sx={{ maxWidth: 400, width: '100%', backgroundColor: 'background.paper', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom textAlign="center">
              Renovação
            </Typography>
            <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
              Carregando...
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <>
    <ThemeProvider>
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%)', p: 2 }}>
        <Card sx={{ maxWidth: 500, width: '100%', bgcolor: 'cardGray', border: 1, borderColor: 'borderGray', boxShadow: '0 4px 24px rgba(0,0,0,0.5)', borderRadius: 4, p: 0 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom textAlign="center" color="primary">
              Renovação de Assinatura
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
              Que bom que você quer continuar conosco! Escolha quantos meses deseja renovar e prossiga para o pagamento.
            </Typography>
            <Divider sx={{ my: 2, bgcolor: 'borderGray' }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">Nome de usuário:</Typography>
                <Typography variant="body1" fontWeight={600} color="primary">
                  {usuario?.nome_usuario || '---'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">Email:</Typography>
                <Typography variant="body1" fontWeight={600} color="primary">
                  {usuario?.email || '---'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">CPF/CNPJ:</Typography>
                <Typography variant="body1" fontWeight={600} color="primary">
                  {usuario?.cpfcnpj ? formatCpfCnpj(usuario.cpfcnpj) : '---'}
                </Typography>
              </Box>
                <TextField
                label="Quantidade de meses"
                type="number"
                value={state.meses}
                onChange={(e) => setField('meses', Number(e.target.value))}
                inputProps={{ min: 1 }}
                fullWidth
                sx={{ mt: 2 }}
              />
            </Box>
            <Divider sx={{ my: 2, bgcolor: 'borderGray' }} />
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                Valor da renovação:
              </Typography>
              <Typography variant="h4" color="primary" textAlign="center" sx={{ mb: 2 }}>
                {state.error ? state.error : `R$ ${state.valor}`}
              </Typography>
            </Box>
            <Divider sx={{ my: 2, bgcolor: 'borderGray' }} />
            <Button
              onClick={handleRenew}
              fullWidth
              variant="contained"
              size="large"
              sx={{ fontWeight: 700, height: 48, bgcolor: 'primary.main', color: 'primary.contrastText', boxShadow: 2 }}
              disabled={!state.idUsuario || !state.valor || !!state.error}
            >
              {state.loading ? 'Processando...' : 'Prosseguir para pagamento'}
            </Button>

            <AssinaturaModal 
              open={Boolean(state.modalOpen)} 
              diasRestantes={diasRestantes} 
              periodoFim={assinatura?.periodo_fim}
              onClose={() => setField('modalOpen', false)}
              onRenovar={async () => {
                setField('modalOpen', false);
                if (!state.idUsuario || !state.valor || !!state.error) return;
                if (!usuario || !usuario.nome_completo || usuario.nome_completo.trim().length < 2) {
                  setError('Preencha o nome completo para continuar');
                  return;
                }
                try {
                  const res = await axios.post('/api/assinatura/checkout', {
                    id_usuario: state.idUsuario,
                    valor: state.valor,
                    meses: state.meses,
                    nome: usuario.nome_completo,
                    cpf: usuario.cpfcnpj || '',
                    email: usuario.email || '',
                    telefone: usuario.telefone || '',
                    endereco: usuario.address || '',
                    numero: usuario.address_number || '',
                    complemento: usuario.complement || '',
                    cep: usuario.postal_code || '',
                    bairro: usuario.province || '',
                    cidade: usuario.city || ''
                  });
                  const link = res.data?.link || res.data?.payment_url || res.data?.paymentUrl || res.data?.url;
                  if (link) {
                    window.location.href = link;
                  } else {
                    setError('Erro ao criar checkout');
                  }
                } catch (err: unknown) {
                  console.error('Erro ao criar checkout (onRenovar):', err);
                  setError('Erro ao criar checkout');
                }
              }}
            />

          </CardContent>
        </Card>
      </Box>
    </ThemeProvider>
      <Toast open={toast.open} onClose={() => setToast(s => ({ ...s, open: false }))} severity={toast.severity} message={toast.message} />
    </>
  );
}

function formatCpfCnpj(value?: string) {
  if (!value) return '';
  const onlyDigits = value.replace(/\D/g, '');
  if (onlyDigits.length === 11) {
    return onlyDigits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (onlyDigits.length === 14) {
    return onlyDigits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return value;
}
