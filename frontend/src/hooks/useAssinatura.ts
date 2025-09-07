import { useState, useEffect } from 'react';
import axios from 'axios';
import { extractErrorMessage } from '@/lib/errorUtils';
import { ConfiguracoesSistema } from '@/interfaces/ConfiguracoesSistema';
import { UsuarioRegisterPayload } from '@/interfaces/UsuarioRegisterPayload';

export interface AssinaturaState {
  isClient: boolean;
  loading: boolean;
  error: string | null;
  valor: string;
  meses: number;
  idUsuario: string;
  usuario: UsuarioRegisterPayload | null;
}

export function useAssinatura() {
  const [state, setState] = useState<AssinaturaState>({
    isClient: false,
    loading: true,
    error: null,
    valor: '',
    meses: 1,
    idUsuario: '',
    usuario: null
  });

  // Obter ID do usuário da URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const idUsuario = params.get('id_usuario') || '';
    setState(prev => ({ ...prev, isClient: true, idUsuario }));
  }, []);

  // Carregar dados do usuário e configurações
  useEffect(() => {
    if (!state.idUsuario) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    let mounted = true;

    const loadData = async () => {
      try {
        // Carregar configurações
        const cfgPromise = axios.get<ConfiguracoesSistema>(`/api/checkout-info?id_usuario=${state.idUsuario}`);
        
        // Carregar dados do usuário
        const userPromise = axios.get(`/api/usuario/${state.idUsuario}`);

        const [cfgRes, userRes] = await Promise.all([cfgPromise, userPromise]);

        if (!mounted) return;

        const usuario: UsuarioRegisterPayload = {
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

        setState(prev => ({
          ...prev,
          valor: cfgRes.data.valor ?? '',
          usuario,
          loading: false
        }));

      } catch (error) {
        if (!mounted) return;
        const msg = extractErrorMessage(error) ?? 'Erro ao carregar dados';
        setState(prev => ({ ...prev, error: msg, loading: false }));
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [state.idUsuario]);

  const updateMeses = (meses: number) => {
    setState(prev => ({ ...prev, meses }));
  };

  const sanitizePhone = (raw?: string | null): string | null => {
    if (!raw) return null;
    const d = String(raw).replace(/\D/g, '');
    if (d.length === 11 || d.length === 10) return '55' + d;
    if (d.length === 13 && d.startsWith('55')) return d;
    return null;
  };

  const sanitizeCep = (raw?: string | null): string | null => {
    if (!raw) return null;
    const d = String(raw).replace(/\D/g, '');
    if (d.length === 8) return d;
    return null;
  };

  const handleCheckout = async () => {
    if (!state.usuario) {
      setState(prev => ({ ...prev, error: 'Usuário não encontrado. Por favor, recarregue a página.' }));
      return;
    }

    const phoneSan = sanitizePhone(state.usuario.telefone);
    const cepSan = sanitizeCep(state.usuario.postal_code);
    
    if (!phoneSan) {
      setState(prev => ({ ...prev, error: 'Telefone inválido. Informe DDD + número (ex: 11999999999)' }));
      return;
    }
    if (!cepSan) {
      setState(prev => ({ ...prev, error: 'CEP inválido. Informe 8 dígitos (ex: 01234567)' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const res = await axios.post('/api/assinatura/checkout', {
        id_usuario: state.idUsuario,
        valor: state.valor,
        meses: state.meses,
        nome: state.usuario.nome_completo,
        cpf: state.usuario.cpfcnpj || '',
        email: state.usuario.email || '',
        telefone: phoneSan,
        endereco: state.usuario.address || '',
        numero: state.usuario.address_number || '',
        complemento: state.usuario.complement || '',
        cep: cepSan,
        bairro: state.usuario.province || '',
        cidade: state.usuario.city || ''
      });

      console.log("data", res);
      const link = res.data.link;
      
      if (link) {
        window.location.href = link;
      } else {
        setState(prev => ({ ...prev, error: 'Erro ao criar checkout', loading: false }));
      }

    } catch (error) {
      console.error('Erro ao criar checkout:', error);
      setState(prev => ({ ...prev, error: 'Erro ao criar checkout', loading: false }));
    }
  };

  return {
    state,
    updateMeses,
    handleCheckout
  };
}
