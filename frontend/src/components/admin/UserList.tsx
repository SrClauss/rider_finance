"use client";
import React, { useEffect, useCallback, useState } from "react";
import useFormReducer from '@/lib/useFormReducer';
import { UsuarioListItem } from "@/interfaces/Usuario";
import { Box, TextField, IconButton, Table, TableHead, TableRow, TableCell, TableBody, Button, CircularProgress, Pagination, Chip, Accordion, AccordionSummary, AccordionDetails, Typography, useTheme, useMediaQuery, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
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

  // Create seeded user modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createNome, setCreateNome] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createNomeCompleto, setCreateNomeCompleto] = useState('');
  const [createSenha, setCreateSenha] = useState('');
  const [createMovPorDia, setCreateMovPorDia] = useState<number | ''>('');
  const [createMeses, setCreateMeses] = useState<number | ''>('');
  const [createMesesAssinatura, setCreateMesesAssinatura] = useState<number | ''>(1);
  // estado de gerar CPF removido (não utilizado)
  const [createCpf, setCreateCpf] = useState('');

  const requestDeleteUser = (id: string, username?: string) => {
    // prevent accidental removal of primary admin user if listed as a user
    if (username === 'admin') {
      setToast({ open: true, severity: 'error', message: 'Remoção do usuário administrador não é permitida aqui.' });
      return;
    }
    setToDelete({ id, username });
    setDeleteOpen(true);
  };

  const openCreateModal = () => {
  setCreateNome(''); setCreateNomeCompleto(''); setCreateEmail(''); setCreateSenha(''); setCreateMovPorDia(''); setCreateMeses(''); setCreateMesesAssinatura(1);
    setCreateOpen(true);
  };

  const createSeedUser = async () => {
    // validations: nome, email, senha required
    if (!createNome.trim() || !createEmail.trim() || !createSenha.trim()) {
      setToast({ open: true, severity: 'error', message: 'nome, email e senha são obrigatórios' });
      return;
    }
    const mov = (createMovPorDia === '' ? 0 : Number(createMovPorDia));
    const meses = (createMeses === '' ? 0 : Number(createMeses));
    let mesesAss = (createMesesAssinatura === '' ? 1 : Number(createMesesAssinatura));
    if (mesesAss < 1) mesesAss = 1; // enforce at least 1 month

    setCreateLoading(true);
    try {
      const payload = {
        nome_usuario: createNome,
        nome_completo: createNomeCompleto || undefined,
        email: createEmail,
        senha: createSenha,
        movimentacoes_por_dia: mov,
        meses: meses,
        meses_assinatura: mesesAss,
        cpf: createCpf || undefined,
        gerar_cpf: createCpf ? false : true,
      };
      const res = await fetch('/api/admin/seed-movimentacao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'include' });
      type SeedApiResponse = { status?: string; mensagem?: string; user?: { id?: string; nome_usuario?: string; email?: string; cpfcnpj?: string } };
      const json = await res.json().catch(() => ({} as SeedApiResponse)) as SeedApiResponse;
      if (!res.ok || json.status !== 'ok') {
        throw new Error(json?.mensagem || 'Erro ao criar usuário');
      }
      // show returned user info if present
      if (json.user) {
        const u = json.user;
        setToast({ open: true, severity: 'success', message: `Usuário criado: ${u.nome_usuario} (${u.email}) CPF: ${u.cpfcnpj}` });
        // Dispatch event para permitir que consumidores reajam (fechar modal, atualizar listas etc.)
        try {
          const ev = new CustomEvent('user:created', { detail: u });
          window.dispatchEvent(ev);
    } catch { /* ignore in non-browser contexts */ }
      } else {
        setToast({ open: true, severity: 'success', message: 'Usuário seed criado com sucesso' });
      }
      setCreateOpen(false);
      await load();
  } catch (err: unknown) {
      const msg = String(err instanceof Error ? err.message : err);
      setToast({ open: true, severity: 'error', message: msg });
    } finally {
      setCreateLoading(false);
    }
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

  // Fecha o modal de criação se outro componente disparar o evento 'user:created'
  useEffect(() => {
    const handler = () => {
      setCreateOpen(false);
      // Recarrega a lista por segurança
      load();
    };
    window.addEventListener('user:created', handler as EventListener);
    return () => { window.removeEventListener('user:created', handler as EventListener); };
  }, [load]);

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
    <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
  <TextField label="Pesquisar por nome" value={q} onChange={(e) => setField('q', e.target.value)} />
  <TextField label="CPF" value={cpf} onChange={(e) => setField('cpf', e.target.value)} />
  <IconButton color="primary" onClick={() => { setField('page', 1); load(); }}><SearchIcon /></IconButton>
  <Box sx={{ flex: 1 }} />
  <Button variant="contained" onClick={openCreateModal}>Criar usuário seed</Button>
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
                    <Typography variant="caption">{u.email ? u.email : 'nome@test.com.br'}</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography><strong>Usuário:</strong> {u.usuario}</Typography>
                    <Typography><strong>Nome:</strong> {u.nome}</Typography>
                    <Typography><strong>E-mail:</strong> {u.email ? u.email : 'nome@test.com.br'}</Typography>
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
                    <TableCell>{u.email ? u.email : 'nome@test.com.br'}</TableCell>
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
  <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
    <DialogTitle>Criar usuário seed</DialogTitle>
    <DialogContent>
      <Box sx={{ position: 'relative' }}>
        {createLoading && (
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.6)', zIndex: 10 }}>
            <CircularProgress />
          </Box>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, opacity: createLoading ? 0.6 : 1 }}>
        <TextField
          label="Nome de usuário"
          value={createNome}
          onChange={(e) => setCreateNome(e.target.value)}
          onBlur={() => {
            // Preenche o e-mail automaticamente apenas se o campo de e-mail estiver vazio
            const nome = (createNome || '').trim();
            if (!createEmail.trim() && nome) {
              // substitui espaços por pontos e normaliza para lowercase
              const sanitized = nome.replace(/\s+/g, '.').toLowerCase();
              setCreateEmail(`${sanitized}@test.com.br`);
            }
          }}
          required
        />
  <TextField label="Nome completo (opcional)" value={createNomeCompleto} onChange={(e) => setCreateNomeCompleto(e.target.value)} />
  <TextField label="E-mail" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} required />
        <TextField label="Senha" type="password" value={createSenha} onChange={(e) => setCreateSenha(e.target.value)} required />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Movimentações/dia"
            type="number"
            value={createMovPorDia}
            onChange={(e) => setCreateMovPorDia(e.target.value === '' ? '' : Number(e.target.value))}
            InputProps={{ inputProps: { min: 0, step: 1 } }}
            sx={{ flex: 1 }}
          />
          <TextField
            label="Meses geração"
            type="number"
            value={createMeses}
            onChange={(e) => setCreateMeses(e.target.value === '' ? '' : Number(e.target.value))}
            InputProps={{ inputProps: { min: 0, step: 1 } }}
            sx={{ width: 140 }}
          />
          <TextField
            label="Meses assinatura"
            type="number"
            value={createMesesAssinatura}
            onChange={(e) => setCreateMesesAssinatura(e.target.value === '' ? '' : Number(e.target.value))}
            InputProps={{ inputProps: { min: 1, step: 1 } }}
            sx={{ width: 180 }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField label="CPF (opcional)" value={createCpf} onChange={(e) => setCreateCpf(e.target.value)} sx={{ flex: 1 }} />
          <Button onClick={async () => {
            // Valida via backend
            try {
              const res = await fetch('/api/admin/validate-cpf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cpf: createCpf }) });
              const json = await res.json();
              if (!res.ok || !json?.valid) {
                setToast({ open: true, severity: 'error', message: json?.message || 'CPF inválido' });
              } else {
                setToast({ open: true, severity: 'success', message: 'CPF válido' });
              }
            } catch { setToast({ open: true, severity: 'error', message: 'Erro ao validar CPF' }); }
          }}>Validar CPF</Button>
        </Box>
        </Box>
      </Box>
    </DialogContent>
    <DialogActions>
    <Button onClick={() => setCreateOpen(false)} disabled={createLoading}>Cancelar</Button>
  <Button onClick={createSeedUser} disabled={createLoading} variant="contained">{createLoading ? 'Criando...' : 'Criar'}</Button>
    </DialogActions>
  </Dialog>
  <Toast open={toast.open} onClose={() => setToast(s => ({ ...s, open: false }))} severity={toast.severity} message={toast.message} />
    </Box>
  );
}
