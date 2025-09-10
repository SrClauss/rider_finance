import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

export default function GainPerKmCard({ value }: { value: number }) {
  return (
    <Card sx={{ minWidth: 180, borderRadius: 2 }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          GANHO / KM
        </Typography>
        <Typography variant="h5" component="div" sx={{ fontWeight: 700 }}>
          R$ {Number(value || 0).toFixed(2)}
        </Typography>
      </CardContent>
    </Card>
  );
}
