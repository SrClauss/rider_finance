"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

type Sessao = {
  id?: string;
  id_usuario?: string;
  inicio?: string;
  fim?: string | null;
  eh_ativa?: boolean;
  total_corridas?: number;
  total_ganhos?: number;
  total_gastos?: number;
  plataforma?: string | null;
  clima?: string | null;
  observacoes?: string | null;
  local_inicio?: string | null;
  local_fim?: string | null;
};

type Transaction = {
  id?: string;
  valor: number;
  tipo?: string;
  id_sessao?: string | null;
  [k: string]: unknown;
};

type SessionContextValue = {
  sessaoAtual?: Sessao | null;
  transacoes: Transaction[];
  totals: { ganhos: number; gastos: number; corridas: number };
  loading: boolean;
  userId?: string | null;
  startModalOpen: boolean;
  openStartModal: () => void;
  closeStartModal: () => void;
  start: (payload?: Partial<Sessao>) => Promise<void>;
  stop: () => Promise<void>;
  attachTransaction: (tx: Transaction) => void;
  refreshFromServer: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessaoAtual, setSessaoAtual] = useState<Sessao | null | undefined>(undefined);
  const [transacoes, setTransacoes] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [startModalOpen, setStartModalOpen] = useState<boolean>(false);

  const totals = {
  ganhos: transacoes.reduce((s, t) => s + (typeof t.valor === "number" && t.tipo !== "saida" ? t.valor : 0), 0),
  gastos: transacoes.reduce((s, t) => s + (typeof t.valor === "number" && t.tipo === "saida" ? t.valor : 0), 0),
    corridas: transacoes.length,
  };

  useEffect(() => {
    // fetch current user id
    axios
      .get("/api/me", { withCredentials: true })
      .then((res) => {
        if (res.data && res.data.id) setUserId(res.data.id);
        else setUserId(null);
      })
      .catch(() => setUserId(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!userId) return;
    // find active session for user
    axios
      .get(`/api/sessao/list/${userId}`, { withCredentials: true })
      .then((res) => {
        if (Array.isArray(res.data)) {
          const active = res.data.find((s: Sessao) => s.eh_ativa === true) as Sessao | undefined;
          setSessaoAtual(active ?? null);
          if (active) {
            // load transactions for session
            axios
              .get(`/api/sessao/com-transacoes/${active.id}`, { withCredentials: true })
              .then((r) => {
                if (r.data && Array.isArray(r.data.transacoes)) setTransacoes(r.data.transacoes as Transaction[]);
                else if (Array.isArray(r.data)) setTransacoes(r.data as Transaction[]);
              })
              .catch(() => {});
          } else {
            setTransacoes([]);
          }
        }
      })
      .catch(() => {});
  }, [userId]);

  const refreshFromServer = async () => {
    if (!sessaoAtual?.id) return;
    try {
      const r = await axios.get(`/api/sessao/com-transacoes/${sessaoAtual.id}`, { withCredentials: true });
      if (r.data && Array.isArray(r.data.transacoes)) setTransacoes(r.data.transacoes as Transaction[]);
      else if (Array.isArray(r.data)) setTransacoes(r.data as Transaction[]);
    } catch (err) {
      console.error("SessionContext.refreshFromServer error", err);
    }
  };

  // Polling to refresh session transactions while session active
  useEffect(() => {
    if (!sessaoAtual?.id) return;
    let mounted = true;
    const iv = setInterval(() => {
      if (!mounted) return;
      refreshFromServer().catch(() => {});
    }, 5000);
    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, [sessaoAtual?.id]);

  const openStartModal = () => setStartModalOpen(true);
  const closeStartModal = () => setStartModalOpen(false);

  const start = async (payload?: Partial<Sessao>) => {
    if (!userId) return;
    setLoading(true);
    try {
      const body = {
        id_usuario: userId,
        inicio: payload?.inicio ?? new Date().toISOString().split(".")[0],
        local_inicio: payload?.local_inicio ?? null,
        plataforma: payload?.plataforma ?? null,
        observacoes: payload?.observacoes ?? null,
        clima: payload?.clima ?? null,
        total_corridas: 0,
        total_ganhos: 0,
        total_gastos: 0,
        eh_ativa: true,
      };
      const res = await axios.post("/api/sessao/start", body, { withCredentials: true });
      setSessaoAtual(res.data ?? null);
      // load transactions
      if (res.data && res.data.id) {
        const r = await axios.get(`/api/sessao/com-transacoes/${res.data.id}`, { withCredentials: true });
        if (r.data && Array.isArray(r.data.transacoes)) setTransacoes(r.data.transacoes as Transaction[]);
        else if (Array.isArray(r.data)) setTransacoes(r.data as Transaction[]);
      }
      setStartModalOpen(false);
    } catch (err) {
      console.error("SessionContext.start error", err);
    } finally {
      setLoading(false);
    }
  };

  const stop = async () => {
    if (!userId || !sessaoAtual?.id) return;
    setLoading(true);
    try {
      const payload = {
        id_sessao: sessaoAtual.id,
        fim: new Date().toISOString().split(".")[0],
        local_fim: null,
        observacoes: null,
      };
      const res = await axios.post("/api/sessao/stop", payload, { withCredentials: true });
      setSessaoAtual(res.data ?? null);
      // refresh transactions/totals
      if (sessaoAtual.id) {
        const r = await axios.get(`/api/sessao/com-transacoes/${sessaoAtual.id}`, { withCredentials: true });
        if (r.data && Array.isArray(r.data.transacoes)) setTransacoes(r.data.transacoes as Transaction[]);
        else if (Array.isArray(r.data)) setTransacoes(r.data as Transaction[]);
      }
    } catch (err) {
      console.error("SessionContext.stop error", err);
    } finally {
      setLoading(false);
    }
  };

  const attachTransaction = (tx: Transaction) => {
    // optimistic attach
    setTransacoes((prev) => [tx, ...prev]);
  };

  

  const value: SessionContextValue = {
    sessaoAtual,
    transacoes,
    totals,
    loading,
    userId: userId ?? null,
    startModalOpen,
    openStartModal,
    closeStartModal,
    start,
    stop,
    attachTransaction,
    refreshFromServer,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
};

export default SessionContext;
