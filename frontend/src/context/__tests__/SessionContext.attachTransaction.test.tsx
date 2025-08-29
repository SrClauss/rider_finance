import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionProvider, useSession } from '@/context/SessionContext';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('SessionContext attachTransaction', () => {
  beforeEach(() => {
  vi.resetAllMocks();
  // Prevent the provider's init effect from completing and overwriting the
  // session we set in the test: make axios.get return a pending promise.
  (mockedAxios.get as any).mockImplementation(() => new Promise(() => {}));
  (mockedAxios.post as any).mockResolvedValue({ data: {} });
  });

  it('adds a transaction to the current session', async () => {
    const now = new Date().toISOString();
    const initialSessao = {
      sessao: { id: 's1', id_usuario: 'user1', inicio: now, eh_ativa: true },
      transacoes: [],
    } as any;

    const tx = { id: 't1', descricao: 'teste', valor: 123 } as any;

    const TestComp = () => {
      const ctx = useSession();
      React.useEffect(() => {
        ctx.setSessao?.(initialSessao);
      }, []);
      return (
        <div>
          <button data-testid="add" onClick={() => ctx.attachTransaction?.(tx)}>add</button>
          <span data-testid="count">{String(ctx.sessao?.transacoes.length ?? 0)}</span>
          <span data-testid="list">{(ctx.sessao?.transacoes.map((t: any) => t.id) || []).join(',')}</span>
        </div>
      );
    };

    render(React.createElement(SessionProvider, null, React.createElement(TestComp, null)));

    // initial count should be 0
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('0'));

    fireEvent.click(screen.getByTestId('add'));

    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('1'));
    expect(screen.getByTestId('list').textContent).toContain('t1');
  });
});
