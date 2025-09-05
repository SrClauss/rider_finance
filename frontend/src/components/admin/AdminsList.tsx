"use client";
import React, { useCallback, useEffect, useState } from 'react';
import { Box, TextField, IconButton, Table, TableHead, TableRow, TableCell, TableBody, Button, CircularProgress, Pagination } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import Toast from '@/components/ui/Toast';

type AdminItem = { id: string; usuario: string };

type BackendAdmin = {
  id: string;
  username?: string;
  usuario?: string;
  nome?: string;
  nome_completo?: string;
  email?: string;
};

export default function AdminsList() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ items: AdminItem[]; total: number; per_page: number }>({ items: [], total: 0, per_page: 20 });
  const [toast, setToast] = useState<{ open: boolean; severity?: 'error' | 'success' | 'info' | 'warning'; message: string }>({ open: false, severity: 'info', message: '' });
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admins?q=${encodeURIComponent(q)}&page=${page}`, { credentials: 'include' });
      const json = await res.json().catch(() => ({} as Record<string, unknown>));
      console.log(json);
      if (!res.ok) {
        let msg = 'Erro ao listar administradores';
        if (json && typeof json === 'object' && 'message' in (json as Record<string, unknown>)) {
          const m = (json as Record<string, unknown>)['message'];
          if (typeof m === 'string') msg = m;
        }
        throw new Error(msg);
      }

      // Backend may return either an array of admins or an object { items: [...] }
      let itemsRaw: BackendAdmin[] = [];
      if (Array.isArray(json)) itemsRaw = json as BackendAdmin[];
      else if (json && typeof json === 'object') {
        const maybeItems = (json as Record<string, unknown>)['items'];
        if (Array.isArray(maybeItems)) itemsRaw = maybeItems as BackendAdmin[];
      }

      const mapped: AdminItem[] = itemsRaw.map((a) => ({
        id: a.id,
        usuario: a.username ?? a.usuario ?? '',
      }));

      let total = mapped.length;
      let per_page = 20;
      if (json && typeof json === 'object') {
        const totalRaw = (json as Record<string, unknown>)['total'];
        const perPageRaw = (json as Record<string, unknown>)['per_page'];
        if (typeof totalRaw === 'number') total = totalRaw;
        if (typeof perPageRaw === 'number') per_page = perPageRaw;
      }
      setData({ items: mapped, total, per_page });

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setToast({ open: true, severity: 'error', message: msg });
    } finally { setLoading(false); }
  }, [q, page]);

  useEffect(() => { load(); }, [load]);

  const doDelete = async (id: string, username?: string) => {
    if (username === 'admin') { setToast({ open: true, severity: 'error', message: 'Remoção do super-admin não é permitida.' }); return; }
    if (!confirm('Deseja realmente excluir este administrador?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admins/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({} as { message?: string }));
        throw new Error(j?.message || 'Erro ao excluir');
      }
      setToast({ open: true, severity: 'success', message: 'Administrador excluído.' });
      await load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setToast({ open: true, severity: 'error', message: msg });
    } finally { setLoading(false); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField label="Pesquisar" value={q} onChange={(e) => setQ(e.target.value)} />
        <IconButton onClick={() => { setPage(1); load(); }}><SearchIcon /></IconButton>
      </Box>
      {loading ? <CircularProgress /> : (
        <Table>
           <TableHead>
             <TableRow>
               <TableCell>Usuário</TableCell>
               <TableCell>Ações</TableCell>
             </TableRow>
           </TableHead>
          <TableBody>
            {data.items.map(a => (
              <TableRow key={a.id}>
                <TableCell>{a.usuario}</TableCell>
                 
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button color="error" onClick={() => doDelete(a.id, a.usuario)}>Excluir</Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Pagination count={Math.max(1, Math.ceil((data.total || 0) / (data.per_page || 20)))} page={page} onChange={(_,v) => setPage(v)} />
      </Box>
      <Toast open={toast.open} onClose={() => setToast(s => ({ ...s, open: false }))} severity={toast.severity} message={toast.message} />
    </Box>
  );
}
