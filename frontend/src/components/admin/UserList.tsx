"use client";
import React, { useEffect, useCallback, useState } from "react";
import useFormReducer from '@/lib/useFormReducer';
import { UsuarioListItem } from "@/interfaces/Usuario";
import { Box, TextField, IconButton, Table, TableHead, TableRow, TableCell, TableBody, Button, CircularProgress, Pagination, Chip, Accordion, AccordionSummary, AccordionDetails, Typography, useTheme, useMediaQuery } from "@mui/material";
// ReplaceAdminPasswordModal removed: admins cannot change other admins' passwords from this list
import DeleteUserConfirmModal from '@/modals/DeleteUserConfirmModal';
import Toast from '@/components/ui/Toast';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { listUsers, blockUser, unblockUser } from "@/lib/api/admin";

export default function UserList() {
  const { state, setField, setLoading } = useFormReducer({ q: '', cpf: '', page: 1 });
  const q = String(state.q ?? '');
  const cpf = String(state.cpf ?? '');
  const page = Number(state.page ?? 1);
  const loading = Boolean(state.loading);
  const [data, setData] = useState<{ items: UsuarioListItem[]; total: number; page: number; per_page: number }>({ items: [] as UsuarioListItem[], total: 0, page: 1, per_page: 20 });
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listUsers({ page, q: q || undefined, cpf: cpf || undefined });
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [page, q, cpf, setLoading]);

  useEffect(() => { load(); }, [load]);

  const doBlock = async (id: string) => {
    setLoading(true);
    try {
      await blockUser(id);
      await load();
    } finally { setLoading(false); }
  };

  const doUnblock = async (id: string) => {
    setLoading(true);
    try {
      await unblockUser(id);
      await load();
    } finally { setLoading(false); }
  };

  // password changes for admins happen only via "Minha conta" dialog; remove replaceOpen state

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<{ id: string; username?: string } | null>(null);
  const [toast, setToast] = useState<{ open: boolean; severity?: 'error' | 'success' | 'info' | 'warning'; message: string }>({ open: false, severity: 'info', message: '' });

  const requestDeleteUser = (id: string, username?: string) => {
    // prevent accidental removal of primary admin user if listed as a user
    if (username === 'admin') {
      setToast({ open: true, severity: 'error', message: 'Remoção do usuário administrador não é permitida aqui.' });
      return;
    }
    setToDelete({ id, username });
    setDeleteOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!toDelete) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${toDelete.id}/hard-delete`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({} as { message?: string }));
        throw new Error(json?.message || 'Erro ao excluir usuário');
      }
      setToast({ open: true, severity: 'success', message: 'Usuário excluído com sucesso.' });
      await load();
    } catch (err: unknown) {
      const msg = String(err instanceof Error ? err.message : err);
      setToast({ open: true, severity: 'error', message: msg });
    } finally {
      setLoading(false);
      setDeleteOpen(false);
      setToDelete(null);
    }
  };

  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  const formatDate = (d?: string | null) => {
    if (!d) return '—';
    // Assumindo que datas do admin vêm em UTC, converter para local
    try {
      const date = new Date(d);
      return date.toLocaleDateString();
    } catch {
      return '—';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
  <TextField label="Pesquisar por nome" value={q} onChange={(e) => setField('q', e.target.value)} />
  <TextField label="CPF" value={cpf} onChange={(e) => setField('cpf', e.target.value)} />
  <IconButton color="primary" onClick={() => { setField('page', 1); load(); }}><SearchIcon /></IconButton>
      </Box>

      {loading ? <CircularProgress /> : (
        isSmall ? (
          // Accordion view for small screens
          <Box>
            {data.items.map((u) => (
              <Accordion key={u.id} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography sx={{ fontWeight: 700 }}>{u.nome || u.usuario}</Typography>
                    <Typography variant="caption">{u.email || ''}</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography><strong>Usuário:</strong> {u.usuario}</Typography>
                    <Typography><strong>Nome:</strong> {u.nome}</Typography>
                    <Typography><strong>E-mail:</strong> {u.email || '—'}</Typography>
                    <Typography><strong>CPF:</strong> {u.cpf || '—'}</Typography>
                    <Typography><strong>Assinatura termina em:</strong> {u.subscription_end ? formatDate(u.subscription_end) : '—'}</Typography>
                    <Typography>
                      <strong>Status:</strong> {u.blocked ? `Bloqueado${u.blocked_date ? ` em ${formatDate(u.blocked_date)}` : ''}` : 'Ativo'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {u.blocked ? <Button onClick={() => doUnblock(u.id)}>Desbloquear</Button> : <Button color="error" onClick={() => doBlock(u.id)}>Bloquear</Button>}
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        ) : (
          // Table view for larger screens
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>E-mail</TableCell>
                  <TableCell>CPF</TableCell>
                  <TableCell>Assinatura</TableCell>
                  <TableCell>Blocked</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.nome || u.usuario}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.cpf}</TableCell>
                    <TableCell>{u.subscription_end ? formatDate(u.subscription_end) : '—'}</TableCell>
                    <TableCell>{u.blocked ? <Chip label={`Bloqueado em ${u.blocked_date ? formatDate(u.blocked_date) : ''}`} color="error" /> : <Chip label="Ativo" color="success" />}</TableCell>
                    <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {u.blocked ? <Button onClick={() => doUnblock(u.id)}>Desbloquear</Button> : <Button color="error" onClick={() => doBlock(u.id)}>Bloquear</Button>}
                            <Button color="error" onClick={() => requestDeleteUser(u.id, u.usuario)}>Excluir</Button>
                          </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )
      )}

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
  <Pagination count={Math.max(1, Math.ceil((data.total || 0) / (data.per_page || 20)))} page={page} onChange={(_,v) => setField('page', v)} />
      </Box>
  <DeleteUserConfirmModal open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={confirmDeleteUser} userName={toDelete?.username ?? null} />
  <Toast open={toast.open} onClose={() => setToast(s => ({ ...s, open: false }))} severity={toast.severity} message={toast.message} />
    </Box>
  );
}
