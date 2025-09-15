"use client";
import React, { useState } from 'react';
import { Box, Typography, Fab } from '@mui/material';
import CreateAdminModal from '@/modals/CreateAdminModal';
import AdminsList from '@/components/admin/AdminsList';
import AddIcon from '@mui/icons-material/Add';

export default function AdminsPage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Administradores</Typography>
        
      </Box>
      <AdminsList />
      <CreateAdminModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => { /* could refresh via context */ }} />
      <Fab color="primary" aria-label="adicionar" sx={{ position: 'fixed', bottom: 64, right: 32 }} onClick={() => setCreateOpen(true)}>
        <AddIcon />
      </Fab>
    </Box>
  );
}
