import React from 'react';
import { Box, Divider, Typography } from '@mui/material';

type Props = {
  children: React.ReactNode;
  sx?: any;
  mt?: number;
  mb?: number;
};

export default function SectionTitle({ children, sx, mt = 3, mb = 3 }: Props) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 0, mt, mb, ...sx }}>
      <Typography variant="h6">{children}</Typography>
      <Divider sx={{ flex: 1, height: 1, bgcolor: 'white', borderRadius: 1, opacity: 0.95 }} />
    </Box>
  );
}
