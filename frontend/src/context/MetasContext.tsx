import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

// Interfaces (ajuste conforme seu projeto)
import type { Goal } from '../interfaces/goal';
import type { Transacao } from '../interfaces/transacao';
import { atualizarTransacoesContexto, AcaoTransacao } from '../utils/atualizarTransacoesContexto';

interface MetasContextType {
  metas: Goal[];
  transacoes: Transacao[];
  setMetas: React.Dispatch<React.SetStateAction<Goal[]>>;
  dispatchTransacao: (transacao: Transacao, acao: AcaoTransacao) => void;
  atualizarMeta: (meta: Goal) => void;
}

const MetasContext = createContext<MetasContextType | undefined>(undefined);

export const useMetasContext = () => {
  const ctx = useContext(MetasContext);
  if (!ctx) throw new Error('useMetasContext deve ser usado dentro de MetasProvider');
  return ctx;
};

export const MetasProvider = ({ children }: { children: ReactNode }) => {
  const [metas, setMetas] = useState<Goal[]>([]);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);

  useEffect(() => {
    const fetchMetasTransacoes = () => {
      axios.get('/api/metas/ativas-com-transacoes')
        .then(res => {
          setMetas(res.data.metas);
          setTransacoes(res.data.transacoes);
          console.log('[MetasContext] Metas e transações carregadas:', res.data);
        });
    };
    fetchMetasTransacoes();
    // Listener para atualização externa
    const handler = (e: any) => {
      if (e?.detail) {
        setMetas(e.detail.metas);
        setTransacoes(e.detail.transacoes);
        console.log('[MetasContext] Metas e transações atualizadas via evento:', e.detail);
      } else {
        fetchMetasTransacoes();
      }
    };
    window.addEventListener('metas:refresh', handler);
    return () => window.removeEventListener('metas:refresh', handler);
  }, []);

  // Atualização otimista de meta
  const atualizarMeta = (meta: Goal) => {
    setMetas(prev => prev.map(m => m.id === meta.id ? meta : m));
  };

  // Função centralizada para add/update/delete
  const dispatchTransacao = (transacao: Transacao, acao: AcaoTransacao) => {
    console.log(`[MetasContext] dispatchTransacao acionado:`, { acao, transacao });
    setTransacoes(prev => {
      const novo = atualizarTransacoesContexto(prev, transacao, acao);
      console.log('[MetasContext] Novo estado de transacoes:', novo);
      return novo;
    });
  };

  return (
    <MetasContext.Provider value={{ metas, transacoes, setMetas, dispatchTransacao, atualizarMeta }}>
      {children}
    </MetasContext.Provider>
  );
};
