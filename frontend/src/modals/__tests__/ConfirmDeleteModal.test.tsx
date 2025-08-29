import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ConfirmDeleteModal from '../ConfirmDeleteModal';
import axios from 'axios';

// Mocks dos hooks de contexto usados pelo componente
vi.mock('@/context/MetasContext', () => ({
  useMetasContext: () => ({ dispatchTransacao: vi.fn() }),
}));
const mockRemove = vi.fn();
vi.mock('@/context/SessionContext', () => ({
  useSession: () => ({ removeTransaction: mockRemove }),
}));

vi.mock('axios');

describe('ConfirmDeleteModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza título, descrição e botões', () => {
    render(<ConfirmDeleteModal open={true} onClose={vi.fn()} idToDelete={null} />);
    expect(screen.getByText('Confirmar exclusão')).toBeInTheDocument();
    expect(screen.getByText('Tem certeza que deseja deletar este item? Esta ação não pode ser desfeita.')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    expect(screen.getByText('Deletar')).toBeInTheDocument();
  });

  it('quando idToDelete não informado, exibe erro local', async () => {
    render(<ConfirmDeleteModal open={true} onClose={vi.fn()} idToDelete={null} />);
    const deleteBtn = screen.getByText('Deletar');
    fireEvent.click(deleteBtn);
    await waitFor(() => {
      expect(screen.getByText('ID da transação não informado')).toBeInTheDocument();
    });
  });

  it('chama axios.delete e atualiza contexts / callbacks em sucesso', async () => {
    // mock axios.delete como sucesso
    // @ts-ignore
    axios.delete = vi.fn().mockResolvedValue({ status: 200 });

    const onClose = vi.fn();
    const onDeleted = vi.fn();
    // Renderiza com id
    render(<ConfirmDeleteModal open={true} onClose={onClose} idToDelete={'tx-1'} onDeleted={onDeleted} />);

    const deleteBtn = screen.getByText('Deletar');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith('/api/transacao/tx-1');
      expect(mockRemove).toHaveBeenCalledWith('tx-1');
      expect(onDeleted).toHaveBeenCalledWith('tx-1');
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('quando axios falha, exibe mensagem de erro extraída', async () => {
    // Simula erro estilo axios com response.data.message
    const err = { response: { data: { message: 'não autorizado' } } };
    // @ts-ignore
    axios.delete = vi.fn().mockRejectedValue(err);

    render(<ConfirmDeleteModal open={true} onClose={vi.fn()} idToDelete={'tx-2'} />);
    const deleteBtn = screen.getByText('Deletar');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(screen.getByText('não autorizado')).toBeInTheDocument();
    });
  });

  it('botão cancelar chama onClose', () => {
    const onClose = vi.fn();
    render(<ConfirmDeleteModal open={true} onClose={onClose} idToDelete={'x'} />);
    const cancel = screen.getByText('Cancelar');
    fireEvent.click(cancel);
    expect(onClose).toHaveBeenCalled();
  });
});
