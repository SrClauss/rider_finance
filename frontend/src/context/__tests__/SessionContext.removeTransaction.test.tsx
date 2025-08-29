import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionProvider, useSession } from '@/context/SessionContext';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('SessionContext removeTransaction', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (mockedAxios.get as any).mockImplementation(() => new Promise(() => {}));
    (mockedAxios.post as any).mockResolvedValue({ data: {} });
  });

  it('removes a transaction by id and calls backend', async () => {
    const now = new Date().toISOString();
    const initialSessao = {
      sessao: { id: 's1', id_usuario: 'user1', inicio: now, eh_ativa: true },
      transacoes: [{ id: 't1', descricao: 'a', valor: 1 }, { id: 't2', descricao: 'b', valor: 2 }],
    } as any;

    const TestComp = () => {
      const ctx = useSession();
      React.useEffect(() => { ctx.setSessao?.(initialSessao); }, []);
      return (
        <div>
          <button data-testid="del-t1" onClick={() => void ctx.removeTransaction?.('t1')}>del</button>
          <span data-testid="count">{String(ctx.sessao?.transacoes.length ?? 0)}</span>
          <span data-testid="list">{(ctx.sessao?.transacoes.map((t: any) => t.id) || []).join(',')}</span>
        </div>
      );
    };

    render(React.createElement(SessionProvider, null, React.createElement(TestComp, null)));

    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('2'));

    fireEvent.click(screen.getByTestId('del-t1'));

    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('1'));
    expect(screen.getByTestId('list').textContent).not.toContain('t1');
    expect((mockedAxios.post as any)).toHaveBeenCalledWith('/api/transacao/delete', { id: 't1' }, expect.anything());
  });
});
