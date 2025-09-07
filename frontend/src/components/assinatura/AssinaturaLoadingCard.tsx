import { Box, Typography, Card, CardContent } from '@mui/material';

export function AssinaturaLoadingCard() {
  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'linear-gradient(135deg, #181818 0%, #232323 100%)', 
        p: 2 
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%', backgroundColor: 'background.paper', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom textAlign="center">
            Assinatura
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
            Carregando...
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
