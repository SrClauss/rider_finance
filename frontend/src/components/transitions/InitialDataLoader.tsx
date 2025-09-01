"use client";
import axios from "axios";
import React, { useEffect, useRef } from "react";
import { useSession } from '@/context/SessionContext';
import { useMetasContext } from '@/context/MetasContext';
import { useRouter } from "next/navigation";

export default function InitialDataLoader({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const sessionContext = useSession();
  const metasContext = useMetasContext();
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const validateAndLoadData = async () => {
      if (hasLoadedRef.current) return; // Já carregou, não fazer novamente

      try {
        console.log("🔄 Validando token...");
        const res = await axios.get("/api/validate_token", { withCredentials: true });
        if (res.data && res.data.valid) {
          console.log("✅ Token válido, carregando dados iniciais...");
          // Token válido, carregar dados iniciais
          await loadInitialData();
          hasLoadedRef.current = true; // Marcar como carregado
        } else {
          console.log("❌ Token inválido, redirecionando para login");
          router.replace("/login");
        }
      } catch (error) {
        console.error("❌ Erro ao validar token:", error);
        router.replace("/login");
      }
    };

    const loadInitialData = async () => {
      try {
        // Carregar sessão ativa
        try {
          // Primeiro obter o ID do usuário
          const meRes = await axios.get('/api/me', { withCredentials: true });
          const userId = meRes.data?.id;

          if (userId) {
            // Buscar sessões do usuário
            const sessionsRes = await axios.get(`/api/sessao/list/${userId}`, { withCredentials: true });
            if (sessionsRes.data && Array.isArray(sessionsRes.data)) {
              // Encontrar sessão ativa
              const activeSession = sessionsRes.data.find((s: any) => s.eh_ativa === true);
              if (activeSession && sessionContext.setSessao) {
                // Buscar sessão com transações
                const sessionWithTx = await axios.get(`/api/sessao/com-transacoes/${activeSession.id}`, { withCredentials: true });
                if (sessionWithTx.data) {
                  sessionContext.setSessao(sessionWithTx.data);
                }
              }
            }
          }
        } catch (sessionError) {
          console.log("Nenhuma sessão ativa encontrada");
          if (sessionContext.setSessao) {
            sessionContext.setSessao(null);
          }
        }

        // Carregar metas com transações
        try {
          console.log("📊 Carregando metas e transações...");
          const metasRes = await axios.get("/api/metas/ativas-com-transacoes", { withCredentials: true });
          if (metasRes.data) {
            console.log("📊 Dados recebidos:", {
              metas: metasRes.data.metas?.length || 0,
              transacoes: metasRes.data.transacoes?.length || 0
            });

            // Popular com dados do backend, verificando duplicatas
            metasRes.data.metas?.forEach((meta: any, index: number) => {
              if (metasContext.dispatchMetas) {
                console.log(`🎯 Adicionando meta ${index + 1}/${metasRes.data.metas.length}:`, meta.id);
                metasContext.dispatchMetas(meta, 'add');
              }
            });
            metasRes.data.transacoes?.forEach((transacao: any, index: number) => {
              if (metasContext.dispatchTransacoes) {
                console.log(`💰 Adicionando transação ${index + 1}/${metasRes.data.transacoes.length}:`, transacao.id);
                metasContext.dispatchTransacoes(transacao, 'add');
              }
            });
          }
        } catch (metasError) {
          console.log("❌ Erro ao carregar metas:", metasError);
        }

      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
      }
    };

    validateAndLoadData();
  }, [router, sessionContext.setSessao, metasContext.dispatchMetas, metasContext.dispatchTransacoes]);

  return <>{children}</>;
}
