import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../app/login/page';

// Mock window.location
const originalLocation = window.location;
beforeAll(() => {
  // @ts-ignore
  delete window.location;
  // @ts-ignore
  window.location = { href: '' };
});
afterAll(() => {
  window.location = originalLocation;
});

describe('LoginPage', () => {
  it('renderiza campos de email e senha', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('exibe erro ao tentar login inválido', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 401,
      ok: false,
      json: async () => ({}),
    });
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'x@y.com' } });
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'errada' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));
    await waitFor(() => {
      expect(screen.getByText(/usuário ou senha inválidos/i)).toBeInTheDocument();
    });
  });

  it('redireciona ao fazer login válido', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({
        data: {
          user: { id: 1, nome: 'Demo', email: 'demo@demo.com' },
          tokens: { access_token: 'token123' },
        },
      }),
    });
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'demo@demo.com' } });
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'demo123' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));
    await waitFor(() => {
      expect(window.location.href).toBe('/');
    });
  });
});
