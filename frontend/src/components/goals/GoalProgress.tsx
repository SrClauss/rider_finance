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
      // Para economia: concluída quando gastou mais que o alvo (ultrapassou o limite)
      return totalAtingido > meta.valor_alvo;
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
    if (isMetaEconomia && isConcluida) {
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
            color: isMetaEconomia && totalAtingido > meta.valor_alvo ? 'error.main' : 'success.main',
            fontWeight: 700,
            textAlign: 'center',
          }}
        >
          {isMetaEconomia && totalAtingido > meta.valor_alvo
            ? `Limite de gastos ultrapassado! Gasto: ${((meta.concluida_com ?? totalAtingido) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
            : `Meta atingida! Valor final: ${((meta.concluida_com ?? totalAtingido) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
          }
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