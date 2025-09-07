import { Box, Typography } from '@mui/material';
import { UsuarioRegisterPayload } from '@/interfaces/UsuarioRegisterPayload';

interface UserInfoSectionProps {
  usuario: UsuarioRegisterPayload | null;
}

function formatCpfCnpj(value?: string) {
  if (!value) return '';
  const onlyDigits = value.replace(/\D/g, '');
  if (onlyDigits.length === 11) {
    return onlyDigits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (onlyDigits.length === 14) {
    return onlyDigits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return value;
}

export function UserInfoSection({ usuario }: UserInfoSectionProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">Nome de usuário:</Typography>
        <Typography variant="body1" fontWeight={600} color="primary">
          {usuario?.nome_usuario || '---'}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">Email:</Typography>
        <Typography variant="body1" fontWeight={600} color="primary">
          {usuario?.email || '---'}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">CPF/CNPJ:</Typography>
        <Typography variant="body1" fontWeight={600} color="primary">
          {usuario?.cpfcnpj ? formatCpfCnpj(usuario.cpfcnpj) : '---'}
        </Typography>
      </Box>
    </Box>
  );
}
