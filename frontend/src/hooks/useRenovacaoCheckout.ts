import { useState, useEffect } from 'react';
import axios from 'axios';
import { extractErrorMessage } from '@/lib/errorUtils';
import { ConfiguracoesSistema } from '@/interfaces/ConfiguracoesSistema';
import { UsuarioRegisterPayload } from '@/interfaces/UsuarioRegisterPayload';

export interface RenovacaoState {
  isClient: boolean;
  loading: boolean;
  error: string | null;
  valor: string;
  meses: number;
  idUsuario: string;
  usuario: UsuarioRegisterPayload | null;
}

export interface ToastState {
  open: boolean;
  severity?: 'error' | 'success' | 'info' | 'warning';
  message: string;
}

export function useRenovacaoCheckout() {
  const [state, setState] = useState<RenovacaoState>({
    isClient: false,
    loading: true,
    error: null,
    valor: '',
    meses: 1,
    idUsuario: '',
    usuario: null
  });

  const [toast, setToast] = useState<ToastState>({
    open: false,
    severity: 'info',
    message: ''
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
        const cfgRes = await axios.get<ConfiguracoesSistema>(`/api/checkout-info?id_usuario=${state.idUsuario}`);
        if (!mounted) return;

        // Carregar dados do usuário
        const userRes = await axios.get(`/api/usuario/${state.idUsuario}`);
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
        setToast({ open: true, severity: 'error', message: msg });
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [state.idUsuario]);

  const updateMeses = (meses: number) => {
    setState(prev => ({ ...prev, meses }));
  };

  const handleRenew = async () => {
    if (!state.usuario) {
      const msg = 'Usuário não encontrado. Por favor, recarregue a página.';
      setState(prev => ({ ...prev, error: msg }));
      setToast({ open: true, severity: 'error', message: msg });
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      const res = await axios.post('/api/assinatura/checkout', {
        id_usuario: state.idUsuario,
        valor: state.valor,
        meses: state.meses,
        nome: state.usuario.nome_completo,
        cpf: state.usuario.cpfcnpj || '',
        email: state.usuario.email || '',
        telefone: state.usuario.telefone || '',
        endereco: state.usuario.address || '',
        numero: state.usuario.address_number || '',
        complemento: state.usuario.complement || '',
        cep: state.usuario.postal_code || '',
        bairro: state.usuario.province || '',
        cidade: state.usuario.city || ''
      });

      const link = res.data?.link || res.data?.payment_url || res.data?.paymentUrl || res.data?.url;
      
      if (link) {
        window.location.href = link;
      } else {
        const msg = res.data?.mensagem || res.data?.message || 'Erro ao criar checkout (sem link)';
        setState(prev => ({ ...prev, error: msg, loading: false }));
        setToast({ open: true, severity: 'error', message: msg });
      }

    } catch (error) {
      console.error('Erro ao criar checkout:', error);
      
      let msg = 'Erro ao criar checkout';
      try {
        if (error && typeof error === 'object') {
          const response = (error as any)?.response;
          const data = response?.data;
          msg = data?.mensagem || data?.message || extractErrorMessage(error) || msg;
        }
      } catch {
        // ignore
      }

      setState(prev => ({ ...prev, error: msg, loading: false }));
      setToast({ open: true, severity: 'error', message: msg });
    }
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, open: false }));
  };

  return {
    state,
    toast,
    updateMeses,
    handleRenew,
    closeToast
  };
}
