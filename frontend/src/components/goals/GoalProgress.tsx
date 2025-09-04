import React, { useMemo, useEffect, useRef } from 'react';
import { Goal } from '@/interfaces/goal';
import { useMetasContext } from '@/context/MetasContext';
import { Box, Typography, LinearProgress } from '@mui/material';
import axios from 'axios';
import { toBackendLocalString } from '@/utils/dateUtils';

interface GoalProgressProps {
  meta: Goal;
  isActive: boolean;
}

/**
 * Componente GoalProgress: Calcula e exibe o progresso de uma meta financeira.
 * Consome MetasContext para obter transações, filtra por período e tipo,
 * calcula total atingido, progresso %, quanto falta, e atualiza meta se necessário.
 * Renderiza barra de progresso ou resumo final baseado no estado da meta.
 */
export const GoalProgress: React.FC<GoalProgressProps> = ({ meta, isActive }) => {
  const { dispatchMetas, transactionsOfMeta } = useMetasContext();

  // Nota: não retornamos cedo aqui para garantir que Hooks sejam sempre chamados;
  // renderizamos indicador de loading mais abaixo após a avaliação dos hooks.

  // Filtra transações relevantes para a meta usando a função do contexto
  const transacoesFiltradas = useMemo(() => {
    const filtered = transactionsOfMeta(meta.id);
    return filtered;
  }, [transactionsOfMeta, meta.id]);

  // Calcula o valor total atingido
  const totalAtingido = useMemo(() => {
    if (meta.tipo === 'lucro') {
      // Para lucro: entradas - saídas
      const entradas = transacoesFiltradas
        .filter((t) => t.tipo === 'entrada')
        .reduce((acc, t) => acc + t.valor, 0);
      const saidas = transacoesFiltradas
        .filter((t) => t.tipo === 'saida')
        .reduce((acc, t) => acc + t.valor, 0);
      const lucro = entradas - saidas;
      return lucro;
    }

    if (meta.tipo === 'economia') {
      // Para economia: soma das saídas (valor gasto)
      const totalGasto = transacoesFiltradas
        .filter((t) => t.tipo === 'saida')
        .reduce((acc, t) => acc + t.valor, 0);
      return totalGasto;
    }

    // Para outros tipos (faturamento): soma simples das transações filtradas
    const total = transacoesFiltradas.reduce((acc, t) => acc + t.valor, 0);
    return total;
  }, [transacoesFiltradas, meta.tipo]);

  // Calcula progresso em %
  const progressoPercentual = useMemo(() => {
    if (meta.valor_alvo <= 0) return 0;

    if (meta.tipo === 'economia') {
      // Para economia: progresso = (valor_alvo - total_gasto) / valor_alvo * 100
      // Barra começa em 100% e diminui conforme gasta
      const progresso = Math.max(0, ((meta.valor_alvo - totalAtingido) / meta.valor_alvo) * 100);
      return Math.min(100, progresso);
    }

    // Para outros tipos: progresso normal (aumenta com valores maiores)
    const progress = Math.min(100, Math.max(0, (totalAtingido / meta.valor_alvo) * 100));
    return progress;
  }, [totalAtingido, meta.valor_alvo, meta.tipo]);
  // Calcula quanto falta para atingir a meta
  const quantoFalta = useMemo(() => {
    if (meta.tipo === 'economia') {
      // Para economia: quanto ainda pode gastar (valor_alvo - total_gasto)
      return Math.max(0, meta.valor_alvo - totalAtingido);
    }
    // Para outros tipos: quanto falta para alcançar (valor_alvo - total_atual)
    return Math.max(0, meta.valor_alvo - totalAtingido);
  }, [meta.valor_alvo, totalAtingido, meta.tipo]);

  // Verifica se a meta é positiva (aumenta com valores maiores) ou negativa (diminui)
  const isMetaPositiva = meta.tipo === 'faturamento' || meta.tipo === 'lucro';

  // Verifica se é meta de economia (barra decrescente)
  const isMetaEconomia = meta.tipo === 'economia';

  // Verifica conclusão e expiração
  const isConcluida = useMemo(() => {
    if (isMetaEconomia) {
      // Para economia (meta negativa): considerada 'concluída' enquanto NÃO extrapola o limite
      return totalAtingido <= meta.valor_alvo;
    }
    if (isMetaPositiva) {
      return totalAtingido >= meta.valor_alvo;
    }
    return totalAtingido <= 0; // Para outros tipos negativos
  }, [totalAtingido, meta.valor_alvo, isMetaPositiva, isMetaEconomia]);

  const isExpirada = useMemo(() => {
    if (!meta.data_fim) return false;
    return new Date() > new Date(meta.data_fim);
  }, [meta.data_fim]);

  // Calcula excesso para metas de economia concluídas
  const excessoGastos = useMemo(() => {
    if (isMetaEconomia && !isConcluida) {
      // Excesso é positivo quando ultrapassou o limite
      return Math.max(0, totalAtingido - meta.valor_alvo);
    }
    return 0;
  }, [isMetaEconomia, isConcluida, totalAtingido, meta.valor_alvo]);

  // Calcula porcentagem do excesso
  const excessoPercentual = useMemo(() => {
    if (excessoGastos > 0 && meta.valor_alvo > 0) {
      return (excessoGastos / meta.valor_alvo) * 100;
    }
    return 0;
  }, [excessoGastos, meta.valor_alvo]);

  // Atualiza a meta no contexto se concluída ou expirada e persiste no backend
  const persistFlags = useRef<Record<string, { concluded?: boolean; expired?: boolean; economia_exceeded?: boolean }>>({});

  useEffect(() => {
    let mounted = true;

  const persistUpdate = async (payload: unknown) => {
      try {
        const res = await axios.put(`/api/meta/${meta.id}`, payload, { withCredentials: true });
        if (res?.data && mounted) {
          // Atualiza o contexto com o que o backend retornou (garante consistência)
          dispatchMetas(res.data, 'update');
        }
      } catch (err) {
        // Falhas de persistência não devem quebrar a UI; log para diagnóstico
        console.error('Erro ao persistir meta:', err);
      }
    };

    // Conclusão/violação detectada no cliente -> atualizar contexto e persistir uma vez
    // Regras distintas:
    // - metas positivas (faturamento/lucro): quando atingem alvo -> eh_concluida: true
    // - metas de economia: consideradas concluídas enquanto NÃO extrapolam; quando extrapolam -> eh_concluida: false

    // Caso metas positivas atinjam o alvo
    // Para metas positivas: quando atingem o alvo, marcar como concluída e registrar `concluida_em`,
    // mas NÃO definir `concluida_com` ainda — este campo será preenchido quando a meta expirar (data_fim).
    if (!isMetaEconomia && isConcluida && !meta.eh_concluida && !persistFlags.current[meta.id]?.concluded) {
      const now = toBackendLocalString(new Date());
      dispatchMetas({ ...meta, eh_concluida: true, concluida_em: now }, 'update');
      persistFlags.current[meta.id] = { ...(persistFlags.current[meta.id] || {}), concluded: true };
  const payload: { eh_concluida: boolean; concluida_em: string } = { eh_concluida: true, concluida_em: now };
      void persistUpdate(payload);
    }

    // Caso meta de economia extrapole o limite -> marcar como NÃO concluída e persistir (primeira transição)
    if (isMetaEconomia && totalAtingido > meta.valor_alvo && meta.eh_concluida && !persistFlags.current[meta.id]?.economia_exceeded) {
      // Atualiza contexto: agora não está concluída (ultrapassou)
      dispatchMetas({ ...meta, eh_concluida: false, concluida_com: totalAtingido }, 'update');
      persistFlags.current[meta.id] = { ...(persistFlags.current[meta.id] || {}), economia_exceeded: true };
  const payload = { eh_concluida: false, concluida_com: totalAtingido, atualizado_em: toBackendLocalString(new Date()) };
      void persistUpdate(payload);
    }

    // Expirada: desativar e persistir no backend (uma vez).
    // Ao expirar, sempre gravar `concluida_com` com o valor atual (para positivos e negativos).
    // Para metas negativas, também registrar `concluida_em` (momento do fim) — assim a UI
    // passa a considerar a meta 'concluída' somente após a data final.
    if (isExpirada && meta.eh_ativa && !persistFlags.current[meta.id]?.expired) {
      const nowIso = toBackendLocalString(new Date());
  const updatePayload: { eh_ativa: boolean; concluida_com: number; atualizado_em: string; concluida_em?: string } = { eh_ativa: false, concluida_com: totalAtingido, atualizado_em: nowIso };
      if (isMetaEconomia) {
        updatePayload.concluida_em = nowIso;
      }
      dispatchMetas({ ...meta, eh_ativa: false, concluida_com: totalAtingido, ...(isMetaEconomia ? { concluida_em: updatePayload.concluida_em } : {}) }, 'update');
      persistFlags.current[meta.id] = { ...(persistFlags.current[meta.id] || {}), expired: true };
      void persistUpdate(updatePayload);
    }

    return () => {
      mounted = false;
    };
  }, [isConcluida, isExpirada, totalAtingido, dispatchMetas, meta, isMetaEconomia]);

  // Renderização condicional
  // Para metas negativas (economia), sempre renderizamos a barra de progresso,
  // mesmo que `meta.eh_concluida` seja true — a conclusão só é mostrada
  // explicitamente quando a data final chegar (isExpirada).

  // Caso: meta positiva concluída e já marcada como concluída -> mostrar resumo final
  if (!isMetaEconomia && meta.eh_concluida) {
    return (
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 60, p: 2 }}>
        <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 700, textAlign: 'center' }}>
          {`Meta atingida! Valor final: ${((meta.concluida_com ?? totalAtingido) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
        </Typography>
      </Box>
    );
  }

  // Caso: meta inativa/expirada -> para metas NÃO-Economia mostramos o valor final;
  // para metas de economia, continuamos mostrando a barra de progresso (e excesso) mesmo se expirada.
  if ((!isActive || isExpirada) && !isMetaEconomia) {
    return (
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', minHeight: 60, p: 2 }}>
        <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 600, textAlign: 'right' }}>
          Valor final: {((meta.concluida_com ?? totalAtingido) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </Typography>
      </Box>
    );
  }

  // Meta ativa: mostra barra de progresso e detalhes
  return (
    <Box sx={{ width: '100%', p: 1 }}>
      {/* Cabeçalho com progresso e valor atual */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: isMetaEconomia ? 'warning.main' : (isMetaPositiva ? 'success.main' : 'error.main'),
            fontWeight: 600,
          }}
        >
          Progresso: {progressoPercentual.toFixed(1)}%
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            fontWeight: 500,
          }}
        >
          {isMetaEconomia
            ? `Gasto: ${(totalAtingido / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
            : `${(totalAtingido / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
          }
        </Typography>
      </Box>

      {/* Barra de progresso */}
      <LinearProgress
        variant="determinate"
        value={progressoPercentual}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: 'grey.300',
          '& .MuiLinearProgress-bar': {
            bgcolor: isMetaEconomia ? 'warning.main' : (isMetaPositiva ? 'success.main' : 'error.main'),
            borderRadius: 4,
          },
        }}
      />

      {/* Barra de excesso para metas de economia concluídas */}
      {isMetaEconomia && excessoGastos > 0 && (
        <Box sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600 }}>
              Excesso: {excessoPercentual.toFixed(1)}% acima do limite
            </Typography>
            <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 500 }}>
              +{(excessoGastos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, excessoPercentual)} // Limita a 100% para não estourar a barra
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'error.main',
                borderRadius: 3,
              },
            }}
          />
        </Box>
      )}

      {/* Quanto falta */}
      <Box sx={{ mt: 1, textAlign: 'center' }}>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontWeight: 500,
          }}
        >
          {isMetaEconomia
            ? (quantoFalta > 0
                ? `Pode gastar mais ${(quantoFalta / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
                : excessoGastos > 0
                  ? `Limite ultrapassado em ${(excessoGastos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
                  : 'Limite de gastos atingido!'
              )
            : (quantoFalta > 0
                ? `Falta ${(quantoFalta / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} para atingir a meta`
                : 'Meta excedida!'
              )
          }
        </Typography>
      </Box>
    </Box>
  );
};