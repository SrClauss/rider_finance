"use client";
import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import CreateAdminModal from '@/modals/CreateAdminModal';
import AdminsList from '@/components/admin/AdminsList';

export default function AdminsPage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Administradores</Typography>
        <Button variant="contained" onClick={() => setCreateOpen(true)}>Criar administrador</Button>
      </Box>
      <AdminsList />
      <CreateAdminModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => { /* could refresh via context */ }} />
    </Box>
  );
}
