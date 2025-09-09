"use client";
import axios from "axios";
import React, { useEffect, useRef } from "react";
import { useSession } from '@/context/SessionContext';
import { useMetasContext } from '@/context/MetasContext';
import { useRouter, usePathname } from "next/navigation";

export default function InitialDataLoader({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setSessao } = useSession();
  const { dispatchMetas, dispatchTransacoes } = useMetasContext();
  const hasLoadedRef = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    const validateAndLoadData = async () => {
      // Define public routes that should NOT trigger token validation/redirects
  const publicPrefixes = ['/admin', '/login', '/register', '/forgot', '/reset', '/assinatura'];
      if (typeof pathname === 'string' && publicPrefixes.some(prefix => pathname.startsWith(prefix))) {
        console.log('InitialDataLoader: skipping token validation for public route:', pathname);
        return;
      }
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
              const activeSession = sessionsRes.data.find((s: unknown) => {
                const ss = s as Record<string, unknown> | null;
                return !!ss && ss.eh_ativa === true;
              });
                try {
                if (activeSession && setSessao) {
                  setSessao(activeSession);
                }
              } catch (error) {
                console.error('Erro ao processar a sessão ativa:', error);
              }
            }
          }
        } catch {
          console.log("Nenhuma sessão ativa encontrada");
          if (setSessao) setSessao(null);
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
            metasRes.data.metas?.forEach((meta: unknown, index: number) => {
      if (dispatchMetas) {
    const m = meta as unknown as import('@/interfaces/goal').Goal;
    const mid = (m && (m as { id?: string | number }).id) ?? undefined;
    console.log(`🎯 Adicionando meta ${index + 1}/${metasRes.data.metas.length}:`, mid);
    dispatchMetas(m, 'add');
      }
    });
  metasRes.data.transacoes?.forEach((transacao: unknown, index: number) => {
      if (dispatchTransacoes) {
    const t = transacao as unknown as import('@/interfaces/transacao').Transacao;
    const tid = (t && (t as { id?: string | number }).id) ?? undefined;
    console.log(`💰 Adicionando transação ${index + 1}/${metasRes.data.transacoes.length}:`, tid);
    dispatchTransacoes(t, 'add');
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
  }, [router, setSessao, dispatchMetas, dispatchTransacoes, pathname]);

  return <>{children}</>;
}
