
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Goal } from '@/interfaces/goal';

interface GoalProgressProps {
  meta: Goal;
  isActive: boolean;
}

interface Transacao {
  valor: number;
  tipo: string;
  data: string;
}

export const GoalProgress: React.FC<GoalProgressProps> = ({ meta, isActive }) => {
  const [progress, setProgress] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finalValue, setFinalValue] = useState<number | null>(meta.concluida_com ?? null);

  useEffect(() => {
    if (!isActive) return;
    if (meta.eh_concluida && typeof meta.concluida_com === 'number') {
      setFinalValue(meta.concluida_com);
      return;
    }
    setLoading(true);
    setError(null);
    let tipoTransacao: string | undefined = undefined;
    if (meta.tipo === 'faturamento') tipoTransacao = 'entrada';
    else if (meta.tipo === 'economia') tipoTransacao = 'saida';
    const payload: any = {
      data_inicio: meta.data_inicio,
      data_fim: meta.data_fim,
    };
    if (tipoTransacao) payload.tipo = tipoTransacao;
    axios.post('/api/transacoes', payload)
      .then(res => {
        const items: Transacao[] = res.data.items;
        let total = 0;
        if (meta.tipo === 'faturamento') {
          total = items.reduce((acc, t) => acc + t.valor, 0);
        } else if (meta.tipo === 'economia') {
          total = items.reduce((acc, t) => acc + t.valor, 0);
        } else if (meta.tipo === 'lucro') {
          const entradas = items.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + t.valor, 0);
          const saidas = items.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + t.valor, 0);
          total = entradas - saidas;
        } else {
          total = items.reduce((acc, t) => acc + t.valor, 0);
        }
        setProgress(
          meta.valor_alvo > 0
            ? Math.max(0, Math.min(100, Math.round((total / meta.valor_alvo) * 100)))
            : 0
        );

        // Checa conclusão
        const isPositive = meta.tipo === 'faturamento' || meta.tipo === 'lucro';
        const isCompleted = isPositive ? total >= meta.valor_alvo : total <= 0;
        const now = new Date();
        const dataFim = meta.data_fim ? new Date(meta.data_fim) : null;
        const isExpired = dataFim && now > dataFim;

        // Se meta foi atingida, marca eh_concluida e salva concluida_com
        if (isCompleted && !meta.eh_concluida) {
          const payload: any = {
            titulo: meta.titulo,
            descricao: !meta.descricao || meta.descricao === '' ? null : meta.descricao,
            tipo: meta.tipo,
            categoria: meta.categoria,
            valor_alvo: meta.valor_alvo,
            valor_atual: meta.valor_atual,
            unidade: !meta.unidade || meta.unidade === '' ? null : meta.unidade,
            data_inicio: meta.data_inicio ? meta.data_inicio.slice(0, 19) : null,
            data_fim: meta.data_fim ? meta.data_fim.slice(0, 19) : null,
            eh_ativa: meta.eh_ativa,
            eh_concluida: true,
            concluida_em: !meta.concluida_em || meta.concluida_em === '' ? null : meta.concluida_em,
            concluida_com: total
          };
       
          axios.put(`/api/meta/${meta.id}`, payload).then(() => {
            setFinalValue(total);
          });
        }

        // Se meta expirou, desativa eh_ativa e salva concluida_com
        if (isExpired && meta.eh_ativa) {
          const payload2: any = {
            titulo: meta.titulo,
            descricao: !meta.descricao || meta.descricao === '' ? null : meta.descricao,
            tipo: meta.tipo,
            categoria: meta.categoria,
            valor_alvo: meta.valor_alvo,
            valor_atual: meta.valor_atual,
            unidade: !meta.unidade || meta.unidade === '' ? null : meta.unidade,
            data_inicio: meta.data_inicio ? meta.data_inicio.slice(0, 19) : null,
            data_fim: meta.data_fim ? meta.data_fim.slice(0, 19) : null,
            eh_ativa: false,
            eh_concluida: meta.eh_concluida,
            concluida_em: !meta.concluida_em || meta.concluida_em === '' ? null : meta.concluida_em,
            concluida_com: total
          };
          axios.put(`/api/meta/${meta.id}`, payload2).then(() => {
            setFinalValue(total);
          });
        }
      })
      .catch(() => setError('Erro ao buscar transações'))
      .finally(() => setLoading(false));
  }, [meta, isActive]);





  if (meta.eh_concluida) {
    // Só mostra o valor final atingido, centralizado e em verde
    return (
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 40 }}>
        {typeof finalValue === 'number' && (
          <span style={{ color: '#00e676', fontWeight: 700, fontSize: 18, textAlign: 'center' }}>
            Valor final atingido: R$ {finalValue.toLocaleString('pt-BR')}
          </span>
        )}
      </div>
    );
  }
  if (!isActive) {
    // Meta expirada/desativada
    return (
      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', minHeight: 40 }}>
        {typeof finalValue === 'number' && (
          <span style={{ color: '#ff1744', fontWeight: 600, fontSize: 12, textAlign: 'right' }}>
            Valor final: R$ {finalValue.toLocaleString('pt-BR')}
          </span>
        )}
      </div>
    );
  }
  if (loading) return <span>Calculando progresso...</span>;
  if (error) return <span className="text-red-600">{error}</span>;
  if (progress === null) return null;

  // Definição de meta positiva/negativa
  // Considera "faturamento" e "lucro" como positivas, "economia" como negativa
  const isPositive = meta.tipo === 'faturamento' || meta.tipo === 'lucro';
  const barColor = isPositive ? '#00e676' : '#ff1744'; // verde brilhante para positivas, vermelho para negativas
  // Para meta negativa, barra "esvazia" da direita para esquerda
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
