import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from "@mui/material";

interface ConfirmDeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export default function ConfirmDeleteModal({ open, onClose, onConfirm, title = "Confirmar exclusão", description = "Tem certeza que deseja deletar este item? Esta ação não pode ser desfeita." }: ConfirmDeleteModalProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: '#ff1744' }}>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 1 }}>
          <Typography variant="body1" sx={{ color: '#fff', mb: 2 }}>{description}</Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" variant="outlined" sx={{ borderRadius: 2 }}>Cancelar</Button>
        <Button onClick={onConfirm} color="error" variant="contained" sx={{ borderRadius: 2, fontWeight: 700 }}>Deletar</Button>
      </DialogActions>
    </Dialog>
  );
}
