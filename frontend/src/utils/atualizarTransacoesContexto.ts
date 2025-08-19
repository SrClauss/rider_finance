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
  transacao: Transacao,
  acao: AcaoTransacao
): Transacao[] {
  switch (acao) {
    case 'add':
      // Adiciona no início
      return [transacao, ...transacoes];
    case 'update':
      // Atualiza pelo id
      return transacoes.map(t => t.id === transacao.id ? transacao : t);
    case 'delete':
      // Remove pelo id
      return transacoes.filter(t => t.id !== transacao.id);
    default:
      return transacoes;
  }
}
