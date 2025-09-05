"use client";
import React, { useEffect, useState, useCallback } from "react";
import { UsuarioListItem } from "@/interfaces/Usuario";
import { Box, TextField, IconButton, Table, TableHead, TableRow, TableCell, TableBody, Button, CircularProgress, Pagination, Chip, Accordion, AccordionSummary, AccordionDetails, Typography, useTheme, useMediaQuery } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { listUsers, blockUser, unblockUser } from "@/lib/api/admin";

export default function UserList() {
  const [q, setQ] = useState('');
  const [cpf, setCpf] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ items: UsuarioListItem[]; total: number; page: number; per_page: number }>({ items: [], total: 0, page: 1, per_page: 20 });
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listUsers({ page, q: q || undefined, cpf: cpf || undefined });
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [page, q, cpf]);

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

  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  const formatDate = (d?: string | null) => d ? new Date(d).toLocaleDateString() : '—';

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField label="Pesquisar por nome" value={q} onChange={(e) => setQ(e.target.value)} />
        <TextField label="CPF" value={cpf} onChange={(e) => setCpf(e.target.value)} />
        <IconButton color="primary" onClick={() => { setPage(1); load(); }}><SearchIcon /></IconButton>
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
                      {u.blocked ? <Button onClick={() => doUnblock(u.id)}>Desbloquear</Button> : <Button color="error" onClick={() => doBlock(u.id)}>Bloquear</Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )
      )}

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Pagination count={Math.max(1, Math.ceil((data.total || 0) / (data.per_page || 20)))} page={page} onChange={(_,v) => setPage(v)} />
      </Box>
    </Box>
  );
}
