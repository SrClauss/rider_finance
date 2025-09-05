"use client";
import React, { useEffect, useState } from "react";
import { Box, Card, CardContent, Typography, CircularProgress } from "@mui/material";
import { getAdminOverview } from "@/lib/api/admin";
import Charts from "@/components/admin/Charts";
import useAdminAuth from "@/hooks/useAdminAuth";

type Overview = {
  new_users_30d?: number;
  not_renewed?: number;
  blocked_count?: number;
  renewal_chart?: { label: string; value: number }[];
};

export default function AdminPage() {
  const [overview, setOverview] = useState<Overview | null>(null);

  const { loading } = useAdminAuth();

  useEffect(() => {
    (async () => {
      try {
        const data = await getAdminOverview();
        setOverview(data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Dashboard Administrativo</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3,1fr)' }, gap: 2, mb: 2 }}>
        <Card>
          <CardContent>
            <Typography variant="subtitle2">Novos últimos 30 dias</Typography>
            <Typography variant="h5">{overview?.new_users_30d ?? '—'}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="subtitle2">Não renovaram</Typography>
            <Typography variant="h5">{overview?.not_renewed ?? '—'}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="subtitle2">Usuários bloqueados</Typography>
            <Typography variant="h5">{overview?.blocked_count ?? '—'}</Typography>
          </CardContent>
        </Card>
      </Box>
      <Box>
        <Card>
          <CardContent>
            <Typography variant="subtitle2">Taxa de renovação (mês passado)</Typography>
            <Charts data={overview?.renewal_chart ?? []} />
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
