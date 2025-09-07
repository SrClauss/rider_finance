"use client";

import React from 'react';
import { Box, Card, CardContent, Typography, Divider } from '@mui/material';
import { ThemeProvider } from '@/theme/ThemeProvider';
import Toast from '@/components/ui/Toast';
import { useRenovacaoCheckout } from '@/hooks/useRenovacaoCheckout';
import { LoadingCard } from '@/components/renovacao/LoadingCard';
import { UserInfoSection } from '@/components/renovacao/UserInfoSection';
import { RenewForm } from '@/components/renovacao/RenewForm';

export default function RenovacaoCheckout() {
  const { state, toast, updateMeses, handleRenew, closeToast } = useRenovacaoCheckout();

  // Renderizar loading enquanto não estiver no cliente ou carregando dados
  if (!state.isClient || state.loading) {
    return <LoadingCard />;
  }

  const canRenew = state.idUsuario && state.valor && !state.error;

  return (
    <>
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
                Renovação de Assinatura
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
                Que bom que você quer continuar conosco! Escolha quantos meses deseja renovar e prossiga para o pagamento.
              </Typography>

              <Divider sx={{ my: 2, bgcolor: 'borderGray' }} />

              {/* User Info */}
              <UserInfoSection usuario={state.usuario} />

              {/* Renew Form */}
              <RenewForm
                meses={state.meses}
                valor={state.valor}
                error={state.error}
                loading={state.loading}
                canRenew={!!canRenew}
                onMesesChange={updateMeses}
                onRenew={handleRenew}
              />
            </CardContent>
          </Card>
        </Box>
      </ThemeProvider>

      <Toast 
        open={toast.open} 
        onClose={closeToast} 
        severity={toast.severity} 
        message={toast.message} 
      />
    </>
  );
}
