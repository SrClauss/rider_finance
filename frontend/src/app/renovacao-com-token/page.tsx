"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { Box, Card, CardContent, Typography, Button, TextField } from '@mui/material';
import { ThemeProvider } from '@/theme/ThemeProvider';

export default function RenovacaoComToken() {
  const search = useSearchParams();
  const router = useRouter();
  const token = search.get('token') || '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [valor, setValor] = useState('');
  const [meses, setMeses] = useState(1);
  const [user, setUser] = useState<{
    id: string;
    nome_usuario: string;
    email: string;
    telefone?: string | null;
    endereco?: string | null;
    numero?: string | null;
    complemento?: string | null;
    cep?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    cpf?: string | null;
    nome_completo?: string | null;
  } | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Token de renovação ausente');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await axios.post('/api/assinatura/verify_renewal_token', { token });
        const basic = res.data; // { id, nome_usuario, email }
        // Busca dados completos do usuário
        const full = await axios.get(`/api/usuario/${basic.id}`);
  setUser({ id: full.data.id, nome_usuario: full.data.nome_usuario, email: full.data.email, telefone: full.data.telefone, endereco: full.data.address, numero: full.data.address_number, complemento: full.data.complement, cep: full.data.postal_code, bairro: full.data.province, cidade: full.data.city, cpf: full.data.cpfcnpj, nome_completo: full.data.nome_completo });
          // tenta buscar o valor padrão do checkout como a página de assinatura faz
          try {
            const info = await axios.get(`/api/checkout-info?id_usuario=${full.data.id}`);
            setValor(info.data.valor ?? '');
          } catch (e) {
            // ignora, manter valor vazio para fallback
          }
      } catch (err: unknown) {
        setError('Token inválido ou expirado');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

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

  // Valida CPF (11 dígitos) e CNPJ (14 dígitos) com algoritmos de dígito verificador
  function validateCpf(cpf: string) {
    const s = cpf.replace(/\D/g, '');
    if (s.length !== 11) return false;
    if (/^(\d)\1+$/.test(s)) return false;
    const calc = (t: number) => {
      let n = 0;
      for (let i = 0; i < t - 1; i++) n += parseInt(s.charAt(i)) * (t - i);
      const r = (n * 10) % 11;
      return r === 10 ? 0 : r;
    };
    return calc(10) === parseInt(s.charAt(9)) && calc(11) === parseInt(s.charAt(10));
  }

  function validateCnpj(cnpj: string) {
    const s = cnpj.replace(/\D/g, '');
    if (s.length !== 14) return false;
    if (/^(\d)\1+$/.test(s)) return false;
    const calc = (t: number) => {
      const nums = s.substring(0, t - 1).split('').map(Number);
      let pos = t - 7;
      let sum = 0;
      for (let i = nums.length - 1; i >= 0; i--) {
        sum += nums[i] * pos;
        pos = pos === 2 ? 9 : pos - 1;
      }
      const res = sum % 11;
      return res < 2 ? 0 : 11 - res;
    };
    return calc(13) === parseInt(s.charAt(12)) && calc(14) === parseInt(s.charAt(13));
  }

  const handleCheckout = async () => {
    if (!user) return;
    const phoneSan = sanitizePhone((user as any).telefone);
    const cepSan = sanitizeCep((user as any).endereco ? (user as any).cep : (user as any).cep);
    try {
      const usedValor = valor && valor !== '' ? valor : '0.00';
      // validação mínima: valor * meses >= 5.00
      const numericValor = Number(String(usedValor).replace(',', '.')) || 0;
      if (numericValor * meses < 5) {
        setError('O valor total (valor × meses) não pode ser menor que R$ 5,00. Ajuste a quantidade de meses ou contate suporte.');
        return;
      }

      // validações de dados pessoais esperados pela API (Asaas): nome completo e CPF/CNPJ limpo
      const fullName = (user as any).nome_completo || (user as any).nome_usuario || user.nome_usuario;
      if (!fullName || String(fullName).trim().length < 2 || String(fullName).trim().split(' ').length < 2) {
        setError('Nome completo inválido ou ausente. Atualize seu perfil com nome completo antes de renovar.');
        return;
      }

      const cpfRaw = ((user as any).cpf || '').toString();
      const cpfSan = cpfRaw.replace(/\D/g, '');
      if (!(cpfSan.length === 11 || cpfSan.length === 14)) {
        setError('CPF/CNPJ inválido. Atualize seu CPF ou CNPJ no perfil antes de renovar.');
        return;
      }
      if (cpfSan.length === 11 && !validateCpf(cpfSan)) {
        setError('CPF inválido. Atualize seu CPF no perfil antes de renovar.');
        return;
      }
      if (cpfSan.length === 14 && !validateCnpj(cpfSan)) {
        setError('CNPJ inválido. Atualize seu CNPJ no perfil antes de renovar.');
        return;
      }

      const payload = {
        id_usuario: user.id,
        valor: usedValor,
        meses,
        nome: fullName,
        cpf: cpfSan,
        email: user.email || '',
        telefone: phoneSan || '',
        endereco: (user as any).endereco || '',
        numero: (user as any).numero || '',
        complemento: (user as any).complemento || '',
        cep: cepSan || '',
        bairro: (user as any).bairro || '',
        cidade: (user as any).cidade || ''
      };
      const res = await axios.post('/api/assinatura/checkout', payload);
      const link = res.data?.link || res.data?.payment_url || res.data?.paymentUrl || res.data?.url;
      if (link) {
        window.location.href = link;
      } else {
        const msg = res.data?.mensagem || 'Erro ao criar checkout';
        setError(String(msg));
      }
    } catch (err) {
      setError('Erro ao criar checkout');
    }
  };

  return (
    <ThemeProvider>
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Card sx={{ maxWidth: 520, width: '100%' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>Renovação de Assinatura</Typography>
            {loading && <Typography>Verificando token...</Typography>}
            {!loading && error && <Typography color="error">{error}</Typography>}
            {!loading && user && (
              <>
                <Typography>Nome de usuário: <strong>{user.nome_usuario}</strong></Typography>
                <Typography>Email: <strong>{user.email}</strong></Typography>
                    <Box sx={{ mt: 3 }}>
                      <TextField
                        label="Quantidade de meses"
                        type="number"
                        value={meses}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMeses(Number(e.target.value))}
                        inputProps={{ min: 1 }}
                        sx={{ mb: 2 }}
                        fullWidth
                      />
                      <Typography sx={{ mb: 1 }}>Valor da assinatura: {valor ? `R$ ${valor}` : '—'}</Typography>
                      <Button variant="contained" onClick={handleCheckout} disabled={!valor || !!error}>Prosseguir para pagamento</Button>
                    </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </ThemeProvider>
  );
}
