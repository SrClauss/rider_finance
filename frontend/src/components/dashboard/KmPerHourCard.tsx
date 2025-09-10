import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

export default function KmPerHourCard({ value }: { value: number }) {
  return (
    <Card sx={{ minWidth: 180, borderRadius: 2 }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          KM / HORA
        </Typography>
        <Typography variant="h5" component="div" sx={{ fontWeight: 700 }}>
          {Number(value || 0).toFixed(2)}
        </Typography>
      </CardContent>
    </Card>
  );
}
