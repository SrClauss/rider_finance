import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

interface AssinaturaModalProps {
  open: boolean;
  diasRestantes: number | null;
  periodoFim?: string | null;
  onClose: () => void;
  onRenovar?: () => void;
}

function formatDataExtenso(dataStr?: string | null) {
  if (!dataStr) return '';
  const data = new Date(dataStr);
  return data.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function AssinaturaModal({ open, diasRestantes, periodoFim, onClose, onRenovar }: AssinaturaModalProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', color: 'primary.main', fontWeight: 700 }}>
        Assinatura premium ativa
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
          Sua assinatura está ativa até:<br />
          <b>{formatDataExtenso(periodoFim)}</b><br />
          Dias restantes: <b>{diasRestantes ?? 0}</b>
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
          Deseja renovar sua assinatura agora mesmo?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ flexDirection: 'column', gap: 1, px: 2, pb: 2 }}>
        <Button variant="contained" color="primary" fullWidth onClick={onRenovar} autoFocus>
          Renovar agora
        </Button>
        <Button variant="outlined" color="primary" fullWidth onClick={onClose}>
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
