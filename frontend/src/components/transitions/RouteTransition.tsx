import React from "react";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { Box, Container, Paper, Typography, LinearProgress, Skeleton } from "@mui/material";

export default function RouteTransition({ message = "Carregando conteúdo..." }: { message?: string }) {
  return (
    <ThemeProvider>
      <Container maxWidth="md">
        <Box sx={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Skeleton variant="rectangular" width="100%" height={300} sx={{ position: 'absolute', borderRadius: 2 }} />
          <Paper elevation={6} sx={{ p: 4, width: '80%', textAlign: 'center', zIndex: 2 }}>
            <Typography variant="h6" gutterBottom>
              {message}
            </Typography>
            <LinearProgress sx={{ width: '100%', mt: 2 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Por favor, aguarde enquanto preparamos sua visualização.
            </Typography>
          </Paper>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
