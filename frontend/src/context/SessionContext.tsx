'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { SessaoComTransacoes } from '@/interfaces/SessaoComTransacoes';



export const SessionContext = createContext<{
  sessao?: SessaoComTransacoes | null;
  setSessao?: (s: SessaoComTransacoes | null) => void;
  elapsedSeconds?: number;
  loading?: boolean;
  start?: (payload?: Partial<SessaoComTransacoes['sessao']>) => Promise<void>;
  stop?: () => Promise<void>;
  attachTransaction?: (tx: SessaoComTransacoes['transacoes'][number]) => void;
  removeTransaction?: (id: string) => Promise<void> | void;
  panelOpen?: boolean;
  setPanelOpen?: (v: boolean) => void;
} | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [sessaoState, setSessaoState] = useState<SessaoComTransacoes | null | undefined>(() => {
    try {
      const raw = localStorage.getItem('rf_sessao');
      if (!raw) return undefined;
      return JSON.parse(raw) as SessaoComTransacoes;
    } catch {
      return undefined;
    }
  });
  // wrapper that persists to localStorage whenever sessao changes
  const setSessao = (s: SessaoComTransacoes | null | undefined) => {
    try {
      if (s === undefined) {
        localStorage.removeItem('rf_sessao');
      } else {
        localStorage.setItem('rf_sessao', JSON.stringify(s));
      }
    } catch {}
    setSessaoState(s ?? null);
    // se sessão ativa, atualiza relógio imediatamente
    try {
      if (s && s.sessao && s.sessao.eh_ativa && s.sessao.inicio) {
        const startMs = new Date(s.sessao.inicio).getTime();
        const now = Date.now();
        setElapsedSeconds(Math.max(0, Math.floor((now - startMs) / 1000)));
      } else {
        setElapsedSeconds(0);
      }
    } catch {
      setElapsedSeconds(0);
    }
  };
  const sessao = sessaoState;
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [panelOpen, setPanelOpen] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('rf_panel_open');
  // Se não existir preferência salva, padrão será RECOLHIDO (false)
  if (raw === null) return false;
  return raw === '1';
    } catch {
  return false;
    }
  });

  // persist panel state
  useEffect(() => {
    try { localStorage.setItem('rf_panel_open', panelOpen ? '1' : '0'); } catch {}
  }, [panelOpen]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const me = await axios.get('/api/me', { withCredentials: true });
        const userId = me?.data?.id;
        if (!userId) {
          if (mounted) setSessao(null);
          return;
        }
        // if we have a cached session in localStorage, try to refresh it from server
        const cached = sessao;
        if (cached && cached.sessao && cached.sessao.id) {
          try {
            const r = await axios.get(`/api/sessao/com-transacoes/${cached.sessao.id}`, { withCredentials: true });
            if (!mounted) return;
            if (r.data) {
              setSessao(r.data as SessaoComTransacoes);
              return;
            }
          } catch {
            // ignore and fallthrough to fetching list
          }
        }
        // fetch list of sessions for user and try to find active one
        const list = await axios.get(`/api/sessao/list/${userId}`, { withCredentials: true });
        if (!mounted) return;
        if (Array.isArray(list.data)) {
          type SessaoListItem = { id: string; eh_ativa: boolean };
          const active = list.data.find((s: SessaoListItem) => s.eh_ativa === true) as SessaoListItem | undefined;
          if (active && active.id) {
            // fetch session with transactions
            const r = await axios.get(`/api/sessao/com-transacoes/${active.id}`, { withCredentials: true });
            if (!mounted) return;
            if (r.data) {
              setSessao(r.data as SessaoComTransacoes);
              return;
            }
          }
        }
        if (mounted) setSessao(null);
      } catch {
        if (mounted) setSessao(null);
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  useEffect(() => {
    let iv: ReturnType<typeof setInterval> | undefined;
    const update = () => {
      if (!sessao || !sessao.sessao || !sessao.sessao.inicio || !sessao.sessao.eh_ativa) {
        setElapsedSeconds(0);
        return;
      }
      try {
        // Corrigir problema de timezone: se a data não tem timezone, assumir UTC
        let startTime: number;
        const inicioStr = sessao.sessao.inicio;

        if (inicioStr.includes('T') && !inicioStr.includes('Z') && !inicioStr.includes('+')) {
          // Data sem timezone explícito - assumir UTC
          startTime = new Date(inicioStr + 'Z').getTime();
        } else {
          startTime = new Date(inicioStr).getTime();
        }

        const now = Date.now();
        const diff = Math.max(0, Math.floor((now - startTime) / 1000));
        setElapsedSeconds(diff);
  // log removido
      } catch {
  // log removido
        setElapsedSeconds(0);
      }
    };
    update(); // update immediately
    if (sessao && sessao.sessao && sessao.sessao.eh_ativa) {
      iv = setInterval(update, 1000);
  // log removido
    } else {
  // log removido
    }
    return () => { if (iv) clearInterval(iv); };
  }, [sessao]);

  const start = async (payload?: Partial<SessaoComTransacoes['sessao']>) => {
    setLoading(true);
    try {
      // avoid creating duplicate active sessions
      if (sessao && sessao.sessao && sessao.sessao.eh_ativa) {
        setLoading(false);
        return;
      }
      // ensure we have user id; fetch /api/me if missing
      let userId = payload?.id_usuario;
      if (!userId) {
        try {
          const me = await axios.get('/api/me', { withCredentials: true });
          userId = me?.data?.id;
        } catch {}
      }
      // build body
      type SessaoCreateBody = Partial<SessaoComTransacoes['sessao']>;
      const body: SessaoCreateBody = {
        id_usuario: userId ?? undefined,
        inicio: payload?.inicio ?? new Date().toISOString().split('.')[0],
        local_inicio: payload?.local_inicio ?? null,
        plataforma: payload?.plataforma ?? null,
        observacoes: payload?.observacoes ?? null,
        clima: payload?.clima ?? null,
        total_corridas: 0,
        total_ganhos: 0,
        total_gastos: 0,
        eh_ativa: true,
      };
      const res = await axios.post('/api/sessao/start', body, { withCredentials: true });
      if (res.data) {
        // if server returns SessaoTrabalho or SessaoComTransacoes, normalize
        if (res.data.transacoes) {
          setSessao(res.data as SessaoComTransacoes);
        } else {
          // server may return only session; fetch with transacoes
          if (res.data.id) {
            const r = await axios.get(`/api/sessao/com-transacoes/${res.data.id}`, { withCredentials: true });
            if (r.data) setSessao(r.data as SessaoComTransacoes);
            else setSessao(null);
          }
        }
        // garantir relógio no caso de inicio imediato - definir elapsedSeconds imediatamente
        try {
          const inicio = res.data.inicio ?? (res.data.sessao && res.data.sessao.inicio);
          if (inicio) {
            // Mesma correção de timezone
            let startMs: number;
            if (inicio.includes('T') && !inicio.includes('Z') && !inicio.includes('+')) {
              startMs = new Date(inicio + 'Z').getTime();
            } else {
              startMs = new Date(inicio).getTime();
            }
            const now = Date.now();
            const initialElapsed = Math.max(0, Math.floor((now - startMs) / 1000));
            setElapsedSeconds(initialElapsed);
            // log removido
          }
        } catch {
          // log removido
        }
        try { localStorage.setItem('rf_active_session', JSON.stringify({ id: res.data.id, inicio: res.data.inicio })); } catch {}
      }
    } catch {
  // log removido
    } finally {
      setLoading(false);
    }
  };

  const stop = async () => {
    if (!sessao || !sessao.sessao || !sessao.sessao.id) return;
    setLoading(true);
    try {
      const payload = { id_sessao: sessao.sessao.id, fim: new Date().toISOString().split('.')[0], local_fim: null, observacoes: null };
      const res = await axios.post('/api/sessao/stop', payload, { withCredentials: true });
      if (res.data) {
        // server returns updated session
        // fetch session with transacoes to update
        if (sessao.sessao.id) {
          const r = await axios.get(`/api/sessao/com-transacoes/${sessao.sessao.id}`, { withCredentials: true });
          if (r.data) setSessao(r.data as SessaoComTransacoes);
          else setSessao(null);
        }
      }
      try { localStorage.removeItem('rf_active_session'); } catch {}
    } catch {
  // log removido
    } finally {
      setLoading(false);
    }
  };

  const attachTransaction = (tx: SessaoComTransacoes['transacoes'][number]) => {
    // se não temos sessao local, tentamos buscar sem bloquear o chamador
    if (!sessao || !sessao.sessao || !sessao.sessao.id) {
      (async () => {
        try {
          // tenta usar active session salvo
          const raw = localStorage.getItem('rf_active_session');
          let id: string | undefined;
          if (raw) {
            try { id = JSON.parse(raw).id; } catch {}
          }
          if (!id) {
            // fallback: fetch list
            const me = await axios.get('/api/me', { withCredentials: true });
            const userId = me?.data?.id;
            if (!userId) return;
            const list = await axios.get(`/api/sessao/list/${userId}`, { withCredentials: true });
            if (Array.isArray(list.data)) {
              type SessaoListItem = { id: string; eh_ativa: boolean };
              const active = list.data.find((s: SessaoListItem) => s.eh_ativa === true) as SessaoListItem | undefined;
              if (active && active.id) id = active.id;
            }
          }
          if (!id) return;
          const r = await axios.get(`/api/sessao/com-transacoes/${id}`, { withCredentials: true });
          if (!r.data) return;
          // agora temos sessao, chama novamente attachTransaction para inserir
          const fresh = r.data as SessaoComTransacoes;
          const newTrans = [tx, ...fresh.transacoes];
          const entradas = newTrans.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + Number(t.valor || 0), 0);
          const saidas = newTrans.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + Number(t.valor || 0), 0);
          const updated: SessaoComTransacoes = {
            ...fresh,
            transacoes: newTrans,
            sessao: { ...fresh.sessao, total_ganhos: entradas, total_gastos: saidas, total_corridas: newTrans.length },
          };
          setSessao(updated);
        } catch {
          // swallow
        }
      })();
      return;
    }

    // já temos sessao local: insere e recalcula totais
    const newTrans = [tx, ...sessao.transacoes];
    const entradas = newTrans.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + Number(t.valor || 0), 0);
    const saidas = newTrans.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + Number(t.valor || 0), 0);
    const updated: SessaoComTransacoes = {
      ...sessao,
      transacoes: newTrans,
      sessao: { ...sessao.sessao, total_ganhos: entradas, total_gastos: saidas, total_corridas: newTrans.length },
    };
    setSessao(updated);
  };

  const removeTransaction = async (id: string) => {
    // Optimistically remove from local state
    const next = (prev: SessaoComTransacoes | null | undefined) => {
      if (!prev) return prev;
      return { ...prev, transacoes: prev.transacoes.filter((t) => t.id !== id) } as SessaoComTransacoes;
    };
    setSessao(next(sessao));
    // Try to inform backend; don't block on failure
    try {
      await axios.post('/api/transacao/delete', { id }, { withCredentials: true });
    } catch {
      // log and swallow
  // log removido
    }
  };

  const value = { sessao, setSessao, elapsedSeconds, loading, start, stop, attachTransaction, removeTransaction, panelOpen, setPanelOpen };
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
};