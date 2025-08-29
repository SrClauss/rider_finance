import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import axios from 'axios';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SessionProvider, useSession } from '@/context/SessionContext';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('SessionContext start integration', () => {
  beforeEach(() => {
    // Use real timers to avoid interactions between fake timers and async promises
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it('calls backend to create session and elapsedSeconds advances', async () => {
    const nowIso = new Date().toISOString();

  (mockedAxios.get as any).mockImplementation((url: string) => {
      if (url === '/api/me') return Promise.resolve({ data: { id: 'user1' } });
      if (url.startsWith('/api/sessao/list/')) return Promise.resolve({ data: [] });
      if (url.startsWith('/api/sessao/com-transacoes/')) {
        return Promise.resolve({ data: { sessao: { id: 's1', id_usuario: 'user1', inicio: nowIso, fim: null, total_corridas: 0, total_ganhos: 0, total_gastos: 0, plataforma: null, observacoes: null, clima: null, eh_ativa: true, criado_em: nowIso, atualizado_em: nowIso }, transacoes: [] } });
      }
      return Promise.resolve({ data: null });
    });

  (mockedAxios.post as any).mockImplementation((url: string) => {
      if (url === '/api/sessao/start') return Promise.resolve({ data: { id: 's1', inicio: nowIso } });
      if (url === '/api/sessao/stop') return Promise.resolve({ data: {} });
      return Promise.resolve({ data: {} });
    });

    const TestComp = () => {
      const ctx = useSession();
      return React.createElement(
        'div',
        null,
        React.createElement('button', { 'data-testid': 'start', onClick: () => void ctx.start?.() }, 'start'),
        React.createElement('span', { 'data-testid': 'id' }, ctx.sessao?.sessao?.id ?? 'null'),
        React.createElement('span', { 'data-testid': 'elapsed' }, String(ctx.elapsedSeconds ?? 0))
      );
    };

  render(React.createElement(SessionProvider, null, React.createElement(TestComp, null)));

  fireEvent.click(screen.getByTestId('start'));

  // ensure the start request was sent and the session id was propagated to UI
  await waitFor(() => expect((mockedAxios.post as any)).toHaveBeenCalledWith('/api/sessao/start', expect.anything(), expect.anything()));

  await waitFor(() => expect(screen.getByTestId('id').textContent).toBe('s1'));

  // elapsed should start at 0 or small
  expect(Number(screen.getByTestId('elapsed').textContent || '0')).toBeGreaterThanOrEqual(0);

  // wait ~2s real time to allow the interval to tick twice and update elapsedSeconds
  await new Promise((res) => setTimeout(res, 2100));

  await waitFor(() => expect(Number(screen.getByTestId('elapsed').textContent || '0')).toBeGreaterThanOrEqual(2));
  }, 10000);
});
