import React from "react";
import { Container, Box, Typography } from "@mui/material";
import { ThemeProvider } from "@/theme/ThemeProvider";
import ViewDashboardButton from "@/components/ViewDashboardButton";

export default function Home() {
  // Esta página é SSR: não redireciona automaticamente para /dashboard.
  // O usuário pode optar por ver o dashboard clicando no botão abaixo.
  return (
    <ThemeProvider>
      <Container maxWidth="md">
        <Box sx={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 2 }}>
          <Typography variant="h4">Bem-vindo ao Rider Finance</Typography>
          <Typography variant="body1" color="text.secondary">Aqui é a página principal de economia. Se quiser ver seu dashboard, clique no botão abaixo.</Typography>
          <ViewDashboardButton />
        </Box>
      </Container>
    </ThemeProvider>
  );
}
