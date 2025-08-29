import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionProvider, useSession } from '@/context/SessionContext';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('SessionContext basic smoke', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		(mockedAxios.get as any).mockImplementation(() => new Promise(() => {}));
	});

	it('provides setSessao and attachTransaction to children', async () => {
		const TestComp = () => {
			const ctx = useSession();
			React.useEffect(() => {
				ctx.setSessao?.({ sessao: { id: 's1', id_usuario: 'u1', inicio: new Date().toISOString(), eh_ativa: true }, transacoes: [] } as any);
			}, []);
			return (
				<div>
					<button data-testid="add" onClick={() => ctx.attachTransaction?.({ id: 't1', descricao: 'x', valor: 1 } as any)}>add</button>
					<span data-testid="count">{String(ctx.sessao?.transacoes.length ?? 0)}</span>
				</div>
			);
		};

		render(React.createElement(SessionProvider, null, React.createElement(TestComp, null)));

		await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('0'));
		fireEvent.click(screen.getByTestId('add'));
		await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('1'));
	});
});

