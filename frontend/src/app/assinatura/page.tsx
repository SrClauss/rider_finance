"use client";

import React from 'react';
import { Box, Card, CardContent, Typography, Divider } from '@mui/material';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useAssinatura } from '@/hooks/useAssinatura';
import { AssinaturaLoadingCard } from '@/components/assinatura/AssinaturaLoadingCard';
import { UserInfoSection } from '@/components/renovacao/UserInfoSection';
import { AssinaturaForm } from '@/components/assinatura/AssinaturaForm';

export default function AssinaturaPage() {
  const { state, updateMeses, handleCheckout } = useAssinatura();

  // Renderizar loading enquanto não estiver no cliente ou carregando dados
  if (!state.isClient || state.loading) {
    return <AssinaturaLoadingCard />;
  }

  const canCheckout = state.idUsuario && state.valor && !state.error;

  return (
    <ThemeProvider>
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%)', 
        p: 2 
      }}>
        <Card sx={{ 
          maxWidth: 500, 
          width: '100%', 
          bgcolor: 'cardGray', 
          border: 1, 
          borderColor: 'borderGray', 
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)', 
          borderRadius: 4, 
          p: 0 
        }}>
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Typography variant="h4" fontWeight={700} gutterBottom textAlign="center" color="primary">
              Assinatura Premium
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
              Desbloqueie recursos exclusivos, relatórios avançados e suporte prioritário!
            </Typography>

            <Divider sx={{ my: 2, bgcolor: 'borderGray' }} />

            {/* User Info */}
            <UserInfoSection usuario={state.usuario} />

            {/* Assinatura Form */}
            <AssinaturaForm
              meses={state.meses}
              valor={state.valor}
              error={state.error}
              loading={state.loading}
              canCheckout={!!canCheckout}
              onMesesChange={updateMeses}
              onCheckout={handleCheckout}
            />
          </CardContent>
        </Card>
      </Box>
    </ThemeProvider>
  );
}

