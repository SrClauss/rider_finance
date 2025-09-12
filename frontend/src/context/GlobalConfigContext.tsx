"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import axios from "axios";

type GlobalConfigContextType = {
  valor: string;
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  updateValor: (novoValor: string) => Promise<void>;
  setValor: React.Dispatch<React.SetStateAction<string>>;
};

const GlobalConfigContext = createContext<GlobalConfigContextType | undefined>(undefined);

export const GlobalConfigProvider = ({ children }: { children: ReactNode }) => {
  const [valor, setValor] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/checkout-info", { withCredentials: true });
      setValor(res.data?.valor ?? "");
      setError(null);
    } catch (e) {
      setError("Erro ao carregar configuração global");
    } finally {
      setLoading(false);
    }
  };

  const updateValor = async (novoValor: string) => {
    setLoading(true);
    try {
      const res = await axios.patch("/api/configuracao/valor_assinatura", { valor: novoValor }, { withCredentials: true });
      // supondo que backend retorna a configuracao atualizada
      setValor(res.data?.valor ?? novoValor);
      setError(null);
    } catch (e) {
      setError("Erro ao atualizar valor da assinatura");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // carrega automaticamente quando provider monta
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GlobalConfigContext.Provider value={{ valor, loading, error, load, updateValor, setValor }}>
      {children}
    </GlobalConfigContext.Provider>
  );
};

export function useGlobalConfig() {
  const ctx = useContext(GlobalConfigContext);
  if (!ctx) throw new Error("useGlobalConfig deve ser usado dentro do GlobalConfigProvider");
  return ctx;
}
