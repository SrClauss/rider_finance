"use client";

import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { ConfiguracoesSistema } from '../../interfaces/ConfiguracoesSistema';

export default function AssinaturaPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [valor, setValor] = useState('');
  const [urlGateway, setUrlGateway] = useState('');
  const [cancelUrl, setCancelUrl] = useState('');
  const [expiredUrl, setExpiredUrl] = useState('');
  const [successUrl, setSuccessUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const searchParams = useSearchParams();
  const idUsuario = searchParams.get('id_usuario') || '';

  useEffect(() => {
    setIsClient(true);
    if (!idUsuario) return;
    axios.get<ConfiguracoesSistema>(`/api/checkout-info?id_usuario=${idUsuario}`)
      .then(res => {
        console.log('Resposta /api/checkout-info:', res);
        setValor(res.data.valor ?? '');
        setUrlGateway(res.data.url_endpoint_pagamento ?? '');
        setCancelUrl(res.data.checkout_cancel_url ?? '');
        setExpiredUrl(res.data.checkout_expired_url ?? '');
        setSuccessUrl(res.data.checkout_success_url ?? '');
        setLoading(false);
      })
      .catch((err) => {
        console.log('Erro /api/checkout-info:', err);
        setError('Erro ao buscar configurações do sistema');
        setLoading(false);
      });
    // Buscar objeto completo do usuário
    axios.get(`/api/usuario/${idUsuario}`)
      .then(res => {
        console.log('Resposta /api/usuario:', res);
        setUsuario(res.data ?? null);
      })
      .catch(err => {
        console.log('Erro /api/usuario:', err);
      });
  }, [idUsuario]);
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
  const handleCheckout = async () => {

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
        cpf: usuario.cpf || '',
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
        console.log('Resposta /api/assinatura/checkout:', res);
      } else {
        setError('Erro ao criar checkout');
      }
    } catch (err) {
      console.log('Erro /api/assinatura/checkout:', err);
      setError('Erro ao criar checkout');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #181818 0%, #232323 100%)', p: 2 }}>
      <Card sx={{ maxWidth: 400, width: '100%', backgroundColor: 'background.paper', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom textAlign="center">
            Assinatura
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
            Valor da assinatura:
          </Typography>
          <Typography variant="h4" color="primary" textAlign="center" sx={{ mb: 4 }}>
            {error ? error : `R$ ${valor}`}
          </Typography>
          <Button
            onClick={handleCheckout}
            fullWidth
            variant="contained"
            size="large"
            sx={{ fontWeight: 600, height: 48 }}
            disabled={!idUsuario || !valor || !!error}
          >
            Ir para pagamento
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
