import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionProvider, useSession } from '@/context/SessionContext';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('SessionContext persistence', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // prevent provider init from completing and interfering with tests by default
    (mockedAxios.get as any).mockImplementation(() => new Promise(() => {}));
    (mockedAxios.post as any).mockResolvedValue({ data: {} });
    // clear localStorage
    try { localStorage.removeItem('rf_active_session'); } catch {}
  });

  it('start() calls backend and persists rf_active_session in localStorage', async () => {
    const nowIso = new Date().toISOString();

    // Provide a minimal /api/me and list flow for provider init
    (mockedAxios.get as any)
      .mockImplementationOnce((url: string) => {
        if (url === '/api/me') return Promise.resolve({ data: { id: 'user1' } });
        return Promise.resolve({ data: null });
      })
      .mockImplementationOnce((url: string) => {
        if (url.startsWith('/api/sessao/list/')) return Promise.resolve({ data: [] });
        return Promise.resolve({ data: null });
      });

    // start returns session id and inicio
    (mockedAxios.post as any).mockImplementationOnce((url: string) => {
      if (url === '/api/sessao/start') return Promise.resolve({ data: { id: 's1', inicio: nowIso } });
      return Promise.resolve({ data: {} });
    });

    // after start, provider fetches /api/sessao/com-transacoes/:id
    (mockedAxios.get as any).mockImplementationOnce((url: string) => {
      if (url.startsWith('/api/sessao/com-transacoes/')) {
        return Promise.resolve({ data: { sessao: { id: 's1', id_usuario: 'user1', inicio: nowIso, eh_ativa: true }, transacoes: [] } });
      }
      return Promise.resolve({ data: null });
    });

    const TestComp = () => {
      const ctx = useSession();
      return (
        <div>
          <button data-testid="start" onClick={() => void ctx.start?.({ id_usuario: 'user1' })}>start</button>
          <span data-testid="ls">{localStorage.getItem('rf_active_session') ?? 'none'}</span>
        </div>
      );
    };

    render(React.createElement(SessionProvider, null, React.createElement(TestComp, null)));

    fireEvent.click(screen.getByTestId('start'));

    await waitFor(() => expect((mockedAxios.post as any)).toHaveBeenCalledWith('/api/sessao/start', expect.anything(), expect.anything()));

    await waitFor(() => {
      const raw = localStorage.getItem('rf_active_session');
      expect(raw).not.toBeNull();
      const v = JSON.parse(raw as string);
      expect(v.id).toBe('s1');
      expect(v.inicio).toBe(nowIso);
    });
  });

  it('stop() calls backend to persist stop and removes rf_active_session', async () => {
    const now = new Date().toISOString();
    // create an active session in context initially
    const initialSessao = {
      sessao: { id: 's1', id_usuario: 'user1', inicio: now, eh_ativa: true },
      transacoes: [],
    } as any;

    // make post for stop resolve
    (mockedAxios.post as any).mockImplementation((url: string) => {
      if (url === '/api/sessao/stop') return Promise.resolve({ data: {} });
      return Promise.resolve({ data: {} });
    });

    // after stop, provider fetches updated session
    (mockedAxios.get as any).mockImplementation((url: string) => {
      if (url.startsWith('/api/sessao/com-transacoes/')) {
        // return a session with eh_ativa false to represent persisted stop
        return Promise.resolve({ data: { sessao: { id: 's1', id_usuario: 'user1', inicio: now, fim: new Date().toISOString(), eh_ativa: false }, transacoes: [] } });
      }
      return new Promise(() => {});
    });

    const TestComp = () => {
      const ctx = useSession();
      React.useEffect(() => {
        ctx.setSessao?.(initialSessao);
        try { localStorage.setItem('rf_active_session', JSON.stringify({ id: 's1', inicio: now })); } catch {}
      }, []);
      return (
        <div>
          <button data-testid="stop" onClick={() => void ctx.stop?.()}>stop</button>
          <span data-testid="ls">{localStorage.getItem('rf_active_session') ?? 'none'}</span>
        </div>
      );
    };

    render(React.createElement(SessionProvider, null, React.createElement(TestComp, null)));

    // sanity: localStorage contains entry
    expect(localStorage.getItem('rf_active_session')).not.toBeNull();

    fireEvent.click(screen.getByTestId('stop'));

    await waitFor(() => expect((mockedAxios.post as any)).toHaveBeenCalledWith('/api/sessao/stop', expect.anything(), expect.anything()));

    await waitFor(() => {
      expect(localStorage.getItem('rf_active_session')).toBeNull();
    });
  });
});
