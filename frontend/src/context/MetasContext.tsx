"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Goal } from '@/interfaces/goal';
import { Transacao } from '@/interfaces/transacao';
import axios from 'axios';

export interface MetasETransacoes{
  metas: Goal[];
  transacoes: Transacao[];
  loading: boolean;
  error: string | null;
  dispatchTransacoes: (transacao: Transacao, action: 'add' | 'update' | 'delete') => void;
  dispatchMetas: (meta: Goal, action: 'add' | 'update' | 'delete') => void;
  transactionsOfMeta: (metaId: string) => Transacao[];
}

const MetasContext = createContext<MetasETransacoes | undefined>(undefined);

// Hook customizado para consumir o contexto
export const useMetasContext = () => {
  const context = useContext(MetasContext);
  if (!context) {
    throw new Error('useMetasContext must be used within MetasProvider');
  }
  return context;
};

export const MetasProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Estados para dados, loading e error
  const [metasETransacoes, setMetasETransacoes] = useState<{
    metas: Goal[];
    transacoes: Transacao[];
  }>({
    metas: [],
    transacoes: [],
  });
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get("/api/metas/ativas-com-transacoes", {
          withCredentials: true
        });
        setMetasETransacoes(response.data);
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao carregar dados';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

 useEffect(()=>{
   console.log('📊 METAS E TRANSAÇÕES ATUALIZADAS:', metasETransacoes);
 }, [metasETransacoes])

  const dispatchTransacoes = useCallback((transacao: Transacao, action: 'add' | 'update' | 'delete') => {
    setMetasETransacoes(prev => {
      switch (action) {
        case 'add':
          return { ...prev, transacoes: [...prev.transacoes, transacao] };
        case 'update':
          return {
            ...prev,
            transacoes: prev.transacoes.map(t => (t.id === transacao.id ? transacao : t)),
          };
        case 'delete':
          return {
            ...prev,
            transacoes: prev.transacoes.filter(t => t.id !== transacao.id),
          };
        default:
          return prev;
      }
    });
  }, []);

  const dispatchMetas = useCallback((meta: Goal, action: 'add' | 'update' | 'delete') => {
    setMetasETransacoes(prev => {
      switch (action) {
        case 'add':
          return { ...prev, metas: [...prev.metas, meta] };
        case 'update':
          return {
            ...prev,
            metas: prev.metas.map(m => (m.id === meta.id ? meta : m)),
          };
        case 'delete':
          return {
            ...prev,
            metas: prev.metas.filter(m => m.id !== meta.id),
          };
        default:
          return prev;
      }
    });
  }, []);

  const transactionsOfMeta = useCallback((metaId: string): Transacao[] => {

    const meta = metasETransacoes.metas.find(m => m.id === metaId);

    if (!meta?.data_inicio) {
      return [];
    }

    // PRIMEIRA ETAPA: Filtrar por período (datas)
    const transacoesNoPeriodo = metasETransacoes.transacoes.filter(t => {
      // Usar timestamps para evitar problemas de timezone
      const dataTransacao = new Date(t.data).getTime();
      const dataInicio = new Date(meta.data_inicio!).getTime();
      const dataFim = meta.data_fim ? new Date(meta.data_fim).getTime() : null;

      // Verifica se está dentro do período usando timestamps
      if (dataTransacao < dataInicio) return false;
      if (dataFim && dataTransacao > dataFim) return false;

      return true;
    });

    // SEGUNDA ETAPA: Filtrar por tipo
    const filtered = transacoesNoPeriodo.filter(t => {
      switch (meta.tipo.toLowerCase()) {
        case 'faturamento':
          return t.tipo === 'entrada';
        case 'economia':
          return t.tipo === 'saida';
        case 'lucro':
          return t.tipo === 'entrada' || t.tipo === 'saida';
        default:
          // Para tipos desconhecidos, incluir todas as transações
          return true;
      }
    });

    return filtered;
  }, [metasETransacoes.metas, metasETransacoes.transacoes]);
  const value: MetasETransacoes = useMemo(() => ({
    metas: metasETransacoes.metas,
    transacoes: metasETransacoes.transacoes,
    loading,
    error,
    dispatchTransacoes,
    dispatchMetas,
    transactionsOfMeta,
  }), [metasETransacoes.metas, metasETransacoes.transacoes, loading, error, dispatchTransacoes, dispatchMetas, transactionsOfMeta]);

  return (
    <MetasContext.Provider value={value}>
      {children}
    </MetasContext.Provider>
  );
};