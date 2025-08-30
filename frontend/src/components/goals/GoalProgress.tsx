import React, { useMemo, useEffect } from 'react';
import { Goal } from '@/interfaces/goal';
import { useMetasContext } from '@/context/MetasContext';
import { Box, Typography, LinearProgress } from '@mui/material';

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
  const { transacoes, dispatchMetas, transactionsOfMeta, loading } = useMetasContext();

  // Se estiver carregando, mostrar indicador
  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Carregando progresso...
        </Typography>
      </Box>
    );
  }

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

    // Para outros tipos: soma simples
    const total = transacoesFiltradas.reduce((acc, t) => acc + t.valor, 0);
    return total;
  }, [transacoesFiltradas, meta.tipo]);

  // Calcula progresso em %
  const progressoPercentual = useMemo(() => {
    if (meta.valor_alvo <= 0) return 0;
    const progress = Math.min(100, Math.max(0, (totalAtingido / meta.valor_alvo) * 100));
    return progress;
  }, [totalAtingido, meta.valor_alvo]);

  // Calcula quanto falta para atingir a meta
  const quantoFalta = useMemo(() => {
    return Math.max(0, meta.valor_alvo - totalAtingido);
  }, [meta.valor_alvo, totalAtingido]);

  // Verifica se a meta é positiva (aumenta com valores maiores) ou negativa (diminui)
  const isMetaPositiva = meta.tipo === 'faturamento' || meta.tipo === 'lucro';

  // Verifica conclusão e expiração
  const isConcluida = useMemo(() => {
    if (isMetaPositiva) {
      return totalAtingido >= meta.valor_alvo;
    }
    return totalAtingido <= 0; // Para economia, atingir 0 ou negativo
  }, [totalAtingido, meta.valor_alvo, isMetaPositiva]);

  const isExpirada = useMemo(() => {
    if (!meta.data_fim) return false;
    return new Date() > new Date(meta.data_fim);
  }, [meta.data_fim]);

  // Atualiza a meta no contexto se concluída ou expirada
  useEffect(() => {
    if (isConcluida && !meta.eh_concluida) {
      dispatchMetas(
        {
          ...meta,
          eh_concluida: true,
          concluida_com: totalAtingido,
        },
        'update'
      );
    }
    if (isExpirada && meta.eh_ativa) {
      dispatchMetas(
        {
          ...meta,
          eh_ativa: false,
          concluida_com: totalAtingido,
        },
        'update'
      );
    }
  }, [isConcluida, isExpirada, totalAtingido, dispatchMetas, meta]);

  // Renderização condicional
  if (meta.eh_concluida) {
    // Meta concluída: mostra valor final atingido
    return (
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 60,
          p: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: 'success.main',
            fontWeight: 700,
            textAlign: 'center',
          }}
        >
          Meta atingida! Valor final: R$ {(meta.concluida_com ?? totalAtingido).toLocaleString('pt-BR')}
        </Typography>
      </Box>
    );
  }

  if (!isActive || isExpirada) {
    // Meta inativa ou expirada: mostra valor final
    return (
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          minHeight: 60,
          p: 2,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: 'error.main',
            fontWeight: 600,
            textAlign: 'right',
          }}
        >
          Valor final: R$ {(meta.concluida_com ?? totalAtingido).toLocaleString('pt-BR')}
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
            color: isMetaPositiva ? 'success.main' : 'error.main',
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
          R$ {totalAtingido.toLocaleString('pt-BR')}
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
            bgcolor: isMetaPositiva ? 'success.main' : 'error.main',
            borderRadius: 4,
          },
        }}
      />

      {/* Quanto falta */}
      <Box sx={{ mt: 1, textAlign: 'center' }}>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontWeight: 500,
          }}
        >
          {quantoFalta > 0
            ? `Falta R$ ${quantoFalta.toLocaleString('pt-BR')} para atingir a meta`
            : 'Meta excedida!'
          }
        </Typography>
      </Box>
    </Box>
  );
};