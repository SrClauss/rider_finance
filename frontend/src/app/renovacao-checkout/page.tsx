"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Card, CardContent, Typography, Button, Divider, TextField } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { ConfiguracoesSistema } from '../../interfaces/ConfiguracoesSistema';
import {ThemeProvider} from '@/theme/ThemeProvider';
import { UsuarioRegisterPayload } from '@/interfaces/UsuarioRegisterPayload';
import AssinaturaModal from '@/modals/AssinaturaModal';

export default function RenovacaoCheckout() {
  const [isClient, setIsClient] = useState(false);
  const [valor, setValor] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<UsuarioRegisterPayload | null>(null);
  const [assinatura, setAssinatura] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [diasRestantes, setDiasRestantes] = useState<number | null>(null);
  const [meses, setMeses] = useState(1);

  const searchParams = useSearchParams();
  const idUsuario = searchParams.get('id_usuario') || '';

  useEffect(() => {
    setIsClient(true);
    if (!idUsuario) {
      // if no id provided, stop loading and show form in minimal mode
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const cfgRes = await axios.get<ConfiguracoesSistema>(`/api/checkout-info?id_usuario=${idUsuario}`);
        setValor(cfgRes.data.valor ?? '');
      } catch (e) {
        setError('Erro ao buscar configurações do sistema');
      }
      try {
        const userRes = await axios.get(`/api/usuario/${idUsuario}`);
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
        setUsuario(usuarioData);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [idUsuario]);

  const handleRenew = async () => {
    if (!usuario) {
      setError('Usuário não encontrado. Por favor, recarregue a página.');
      return;
    }
    try {
      const res = await axios.post('/api/assinatura/checkout', {
        id_usuario: idUsuario,
        valor,
        meses,
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
        alert(msg);
      }
    } catch (err: any) {
      console.error('Erro ao criar checkout:', err);
      const resp = err?.response?.data;
      const msg = resp?.mensagem || resp?.message || (resp ? JSON.stringify(resp) : err.message || 'Erro ao criar checkout');
      setError(msg);
      alert(msg);
    }
  };

  if (!isClient) return null;
  if (loading) {
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
                value={meses}
                onChange={(e) => setMeses(Number(e.target.value))}
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
                {error ? error : `R$ ${valor}`}
              </Typography>
            </Box>
            <Divider sx={{ my: 2, bgcolor: 'borderGray' }} />
            <Button
              onClick={handleRenew}
              fullWidth
              variant="contained"
              size="large"
              sx={{ fontWeight: 700, height: 48, bgcolor: 'primary.main', color: 'primary.contrastText', boxShadow: 2 }}
              disabled={!idUsuario || !valor || !!error}
            >
              {loading ? 'Processando...' : 'Prosseguir para pagamento'}
            </Button>

            <AssinaturaModal 
              open={modalOpen} 
              diasRestantes={diasRestantes} 
              periodoFim={assinatura?.periodo_fim}
              onClose={() => setModalOpen(false)}
              onRenovar={async () => {
                setModalOpen(false);
                if (!idUsuario || !valor || !!error) return;
                if (!usuario || !usuario.nome_completo || usuario.nome_completo.trim().length < 2) {
                  setError('Preencha o nome completo para continuar');
                  return;
                }
                try {
                  const res = await axios.post('/api/assinatura/checkout', {
                    id_usuario: idUsuario,
                    valor,
                    meses,
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
                } catch (err) {
                  setError('Erro ao criar checkout');
                }
              }}
            />

          </CardContent>
        </Card>
      </Box>
    </ThemeProvider>
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
