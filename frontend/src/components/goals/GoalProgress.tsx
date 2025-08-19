
import React, { useMemo } from 'react';
import { Goal } from '@/interfaces/goal';
import { useMetasContext } from '../../context/MetasContext';

interface GoalProgressProps {
  meta: Goal;
  isActive: boolean;
}

export const GoalProgress: React.FC<GoalProgressProps> = ({ meta, isActive }) => {
  const { transacoes, atualizarMeta } = useMetasContext();

  // Filtra transações relevantes para a meta
  const transacoesMeta = useMemo(() => {
    return transacoes.filter(t => {
      const dataTransacao = new Date(t.data);
      const dataInicio = new Date(meta.data_inicio);
      const dataFim = meta.data_fim ? new Date(meta.data_fim) : undefined;
      if (dataTransacao < dataInicio) return false;
      if (dataFim && dataTransacao > dataFim) return false;
      // Filtros por tipo de meta
      if (meta.tipo === 'faturamento' && t.tipo !== 'entrada') return false;
      if (meta.tipo === 'economia' && t.tipo !== 'saida') return false;
      return true;
    });
  }, [transacoes, meta]);

  // Calcula o valor total atingido
  const total = useMemo(() => {
    if (meta.tipo === 'lucro') {
      const entradas = transacoesMeta.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + t.valor, 0);
      const saidas = transacoesMeta.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + t.valor, 0);
      return entradas - saidas;
    }
    return transacoesMeta.reduce((acc, t) => acc + t.valor, 0);
  }, [transacoesMeta, meta.tipo]);

  // Calcula progresso em %
  const progress = meta.valor_alvo > 0 ? Math.max(0, Math.min(100, Math.round((total / meta.valor_alvo) * 100))) : 0;

  // Checa conclusão e expiração
  const isPositive = meta.tipo === 'faturamento' || meta.tipo === 'lucro';
  const isCompleted = isPositive ? total >= meta.valor_alvo : total <= 0;
  const now = new Date();
  const dataFim = meta.data_fim ? new Date(meta.data_fim) : null;
  const isExpired = dataFim && now > dataFim;

  // Atualiza meta no contexto se necessário
  React.useEffect(() => {
    if (isCompleted && !meta.eh_concluida) {
      atualizarMeta({ ...meta, eh_concluida: true, concluida_com: total });
    }
    if (isExpired && meta.eh_ativa) {
      atualizarMeta({ ...meta, eh_ativa: false, concluida_com: total });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompleted, isExpired]);

  if (meta.eh_concluida) {
    // Só mostra o valor final atingido, centralizado e em verde
    return (
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 40 }}>
        <span style={{ color: '#00e676', fontWeight: 700, fontSize: 18, textAlign: 'center' }}>
          Valor final atingido: R$ {(meta.concluida_com ?? total).toLocaleString('pt-BR')}
        </span>
      </div>
    );
  }
  if (!isActive) {
    // Meta expirada/desativada
    return (
      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', minHeight: 40 }}>
        <span style={{ color: '#ff1744', fontWeight: 600, fontSize: 12, textAlign: 'right' }}>
          Valor final: R$ {(meta.concluida_com ?? total).toLocaleString('pt-BR')}
        </span>
      </div>
    );
  }
  // Barra de progresso
  const barColor = isPositive ? '#00e676' : '#ff1744';
  const barStyle = isPositive
    ? { left: 0, width: `${progress}%` }
    : { right: 0, width: `${100 - progress}%` };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: isPositive ? '#00e676' : '#ff1744' }}>Progresso</span>
        <span style={{ fontSize: 12, fontWeight: 500, color: isPositive ? '#00e676' : '#ff1744' }}>{progress}%</span>
      </div>
      <div style={{ position: 'relative', width: '100%', background: '#fff', borderRadius: 8, height: 8, overflow: 'hidden', border: '1px solid #eee' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            ...barStyle,
            background: barColor,
            borderRadius: 8,
            transition: 'width 0.5s',
          }}
        />
      </div>
    </div>
  );
};
