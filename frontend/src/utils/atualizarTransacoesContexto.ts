import type { Transacao } from '../interfaces/transacao';

export type AcaoTransacao = 'add' | 'update' | 'delete';

/**
 * Atualiza o array de transações conforme a ação desejada.
 * @param transacoes Estado atual do contexto
 * @param transacao Objeto de transação a ser adicionado/atualizado/removido
 * @param acao Tipo da ação: 'add', 'update', 'delete'
 * @returns Novo array de transações
 */
export function atualizarTransacoesContexto(
  transacoes: Transacao[],
  transacao: Partial<Transacao>,
  acao: AcaoTransacao
): Transacao[] {
  switch (acao) {
    case 'add':
      // Para add, garantimos que temos um id e valores mínimos; se faltar, retornamos o estado atual
      if (!transacao.id) return transacoes;
      return [transacao as Transacao, ...transacoes];
    case 'update':
      // Atualiza pelo id; se não houver id, nada a fazer
      if (!transacao.id) return transacoes;
      return transacoes.map(t => t.id === transacao.id ? { ...t, ...(transacao as Partial<Transacao>) } as Transacao : t);
    case 'delete':
      // Remove pelo id
      if (!transacao.id) return transacoes;
      return transacoes.filter(t => t.id !== transacao.id);
    default:
      return transacoes;
  }
}
