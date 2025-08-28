"use client";

import { Box, Card, CardContent, Typography, Button, Divider, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ConfiguracoesSistema } from '../../interfaces/ConfiguracoesSistema';
import {ThemeProvider} from '@/theme/ThemeProvider';
import { UsuarioRegisterPayload } from '@/interfaces/UsuarioRegisterPayload';
import AssinaturaModal from '@/modals/AssinaturaModal';

export default function AssinaturaPage() {

  const [isClient, setIsClient] = useState(false);
  const [valor, setValor] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<UsuarioRegisterPayload | null>(null);
  const [assinatura] = useState<{ periodo_fim?: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [diasRestantes] = useState<number | null>(null);
  const [meses, setMeses] = useState(1); // Novo estado para quantidade de meses
  const [idUsuario, setIdUsuario] = useState('');

  // Evita usar useSearchParams (que requer suspense) durante o build.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setIdUsuario(params.get('id_usuario') || '');
  }, []);

  useEffect(() => {
    setIsClient(true);
    if (!idUsuario) return;
    axios.get<ConfiguracoesSistema>(`/api/checkout-info?id_usuario=${idUsuario}`)
      .then(res => {
        setValor(res.data.valor ?? '');
        setLoading(false);
      })
      .catch(() => {
        setError('Erro ao buscar configurações do sistema');
        setLoading(false);
      });
    axios.get(`/api/usuario/${idUsuario}`)
      .then(res => {
        const usuarioData = {
          id: res.data.id,
          nome_usuario: res.data.nome_usuario,
          email: res.data.email,
          senha: res.data.senha,
          nome_completo: res.data.nome_completo,
          telefone: res.data.telefone,
          veiculo: res.data.veiculo,
          data_inicio_atividade: res.data.data_inicio_atividade,
          eh_pago: res.data.eh_pago,
          id_pagamento: res.data.id_pagamento,
          metodo_pagamento: res.data.metodo_pagamento,
          status_pagamento: res.data.status_pagamento,
          tipo_assinatura: res.data.tipo_assinatura,
          trial_termina_em: res.data.trial_termina_em,
          criado_em: res.data.criado_em,
          atualizado_em: res.data.atualizado_em,
          ultima_tentativa_redefinicao: res.data.ultima_tentativa_redefinicao,
          address: res.data.address,
          address_number: res.data.address_number,
          complement: res.data.complement,
          postal_code: res.data.postal_code,
          province: res.data.province,
          city: res.data.city,
          cpfcnpj: res.data.cpfcnpj,
          captcha_token: res.data.captcha_token,
          captcha_answer: res.data.captcha_answer
        }
        setUsuario(usuarioData);
  })
  .catch(() => {});
  }, [idUsuario]);

  function sanitizePhone(raw?: string | null) {
    if (!raw) return null;
    const d = String(raw).replace(/\D/g, '');
    if (d.length === 11 || d.length === 10) return '55' + d;
    if (d.length === 13 && d.startsWith('55')) return d;
    return null;
  }

  function sanitizeCep(raw?: string | null) {
    if (!raw) return null;
    const d = String(raw).replace(/\D/g, '');
    if (d.length === 8) return d;
    return null;
  }

  // update handleCheckout to use sanitized values
  const handleCheckout = async () => {
    if (!usuario) {
      setError('Usuário não encontrado. Por favor, recarregue a página.');
      return;
    }
    const phoneSan = sanitizePhone(usuario.telefone);
    const cepSan = sanitizeCep(usuario.postal_code);
    if (!phoneSan) {
      setError('Telefone inválido. Informe DDD + número (ex: 11999999999)');
      return;
    }
    if (!cepSan) {
      setError('CEP inválido. Informe 8 dígitos (ex: 01234567)');
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
        telefone: phoneSan,
        endereco: usuario.address || '',
        numero: usuario.address_number || '',
        complemento: usuario.complement || '',
        cep: cepSan,
        bairro: usuario.province || '',
        cidade: usuario.city || ''
      });
      const link = res.data.link;
      if (link) {
        window.location.href = link;
      } else {
        setError('Erro ao criar checkout');
      }
    } catch {
      setError('Erro ao criar checkout');
    }
  };


  if (!isClient) return null;
  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #181818 0%, #232323 100%)', p: 2 }}>
        <Card sx={{ maxWidth: 400, width: '100%', backgroundColor: 'background.paper', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom textAlign="center">
              Assinatura
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
              Assinatura Premium
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
              Desbloqueie recursos exclusivos, relatórios avançados e suporte prioritário!
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
                Valor da assinatura:
              </Typography>
              <Typography variant="h4" color="primary" textAlign="center" sx={{ mb: 2 }}>
                {error ? error : `R$ ${valor}`}
              </Typography>
            </Box>
            <Divider sx={{ my: 2, bgcolor: 'borderGray' }} />
            <Button
              onClick={handleCheckout}
              fullWidth
              variant="contained"
              size="large"
              sx={{ fontWeight: 700, height: 48, bgcolor: 'primary.main', color: 'primary.contrastText', boxShadow: 2 }}
              disabled={!idUsuario || !valor || !!error}
            >
              {loading ? 'Processando...' : 'Ir para pagamento'}
            </Button>
            <AssinaturaModal 
              open={modalOpen} 
              diasRestantes={diasRestantes} 
              periodoFim={assinatura?.periodo_fim}
              onClose={() => setModalOpen(false)}
              onRenovar={async () => {
                setModalOpen(false);
                // Executa fluxo de renovação normalmente
                if (!idUsuario || !valor || !!error) return;
                if (!usuario || !usuario.nome_completo || usuario.nome_completo.trim().length < 2) {
                  setError('Preencha o nome completo para continuar');
                  return;
                }
                try {
                  const res = await axios.post('/api/assinatura/checkout', {
                    id_usuario: idUsuario,
                    valor,
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
                  const link = res.data.link;
                  if (link) {
                    window.location.href = link;
                  } else {
                    setError('Erro ao criar checkout');
                  }
                } catch {
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
    // CPF: 000.000.000-00
    return onlyDigits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (onlyDigits.length === 14) {
    // CNPJ: 00.000.000/0000-00
    return onlyDigits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return value;
}

