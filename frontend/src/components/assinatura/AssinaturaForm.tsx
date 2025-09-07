import { Box, Typography, TextField, Button, Divider } from '@mui/material';

interface AssinaturaFormProps {
  meses: number;
  valor: string;
  error: string | null;
  loading: boolean;
  canCheckout: boolean;
  onMesesChange: (meses: number) => void;
  onCheckout: () => void;
}

export function AssinaturaForm({ 
  meses, 
  valor, 
  error, 
  loading, 
  canCheckout, 
  onMesesChange, 
  onCheckout 
}: AssinaturaFormProps) {
  return (
    <>
      <TextField
        label="Quantidade de meses"
        type="number"
        value={meses}
        onChange={(e) => onMesesChange(Number(e.target.value))}
        inputProps={{ min: 1 }}
        fullWidth
        sx={{ mt: 2 }}
      />
      
      <Divider sx={{ my: 2, bgcolor: 'borderGray' }} />
      
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
          Valor da assinatura:
        </Typography>
        <Typography variant="h4" color={error ? "error" : "primary"} textAlign="center" sx={{ mb: 2 }}>
          {error ? error : `R$ ${valor}`}
        </Typography>
      </Box>
      
      <Divider sx={{ my: 2, bgcolor: 'borderGray' }} />
      
      <Button
        onClick={onCheckout}
        fullWidth
        variant="contained"
        size="large"
        sx={{ 
          fontWeight: 700, 
          height: 48, 
          bgcolor: 'primary.main', 
          color: 'primary.contrastText', 
          boxShadow: 2 
        }}
        disabled={!canCheckout || loading}
      >
        {loading ? 'Processando...' : 'Ir para pagamento'}
      </Button>
    </>
  );
}
