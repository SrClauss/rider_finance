"use client";
import React from 'react';
import { Card, CardContent, Typography, Box, Stack, Divider } from '@mui/material';
import { formatarMoeda } from '@/utils/currencyUtils';
import SectionTitle from '../ui/SectionTitle';

interface Props {
  weekly?: number;
  monthly?: number;
  method?: string;
}

export default function ProjectionsCard({ weekly = 0, monthly = 0, method }: Props) {
  return (
    <Box>
      <SectionTitle>Projeções</SectionTitle>

      <Card sx={{ width: '100%', bgcolor: 'background.paper' }}>
        <CardContent sx={{ pt: 1, pb: 0, px: 2, mb: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
          <Stack direction="row" spacing={0} sx={{ alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  Projeção Semanal
                </Typography>
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: 'success.main' }}>
                  {formatarMoeda(weekly)}
                </Typography>
              </Box>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 0, height: 48 }} />

            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0 }}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  Projeção Mensal
                </Typography>
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: 'success.main' }}>
                  {formatarMoeda(monthly)}
                </Typography>
              </Box>
            </Box>
          </Stack>

          {/* Método único exibido centralizado no bottom do card */}
          <Box sx={{ width: '100%', textAlign: 'center', mt: 0 }}>

            <Typography variant="caption" sx={{ color: 'text.primary', lineHeight: 1 }}>
                {"Metodo de Calculo: "}
          </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', m: 0, lineHeight: 1 }}>
              {method?.replace("_", " ") ?? 'Não informado'}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
