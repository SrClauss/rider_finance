"use client";
import React from "react";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { Box, AppBar, Toolbar, Typography, Button, CircularProgress } from "@mui/material";
import axios from "axios";
import { useRouter, usePathname } from "next/navigation";
import useAdminAuth from "@/hooks/useAdminAuth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Do not enforce admin auth on the login page itself
  const isLoginPage = typeof pathname === 'string' && (pathname === '/admin/login' || pathname === '/admin/login/');

  // Only check auth for protected admin pages
  const { loading } = useAdminAuth(!isLoginPage);

  const logout = async () => {
    try {
      await axios.post('/api/admin/logout', {}, { withCredentials: true });
    } catch {
      // ignore
    }
    router.push('/admin/login');
  };

  return (
    <ThemeProvider>
      <Box>
        {/* Apenas mostrar a AppBar e links quando NÃO estivermos na página de login */}
        {!isLoginPage && (
          <AppBar position="static" elevation={1} sx={{ backgroundColor: 'background.paper', color: 'text.primary' }}>
            <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Painel Admin</Typography>
              <Box>
                <Button onClick={() => router.push('/admin/users')}>Usuários</Button>
                <Button onClick={() => router.push('/admin')}>Dashboard</Button>
                <Button color="error" onClick={logout}>Sair</Button>
              </Box>
            </Toolbar>
          </AppBar>
        )}

        {/* Show loading while auth is being checked for protected admin pages */}
        {(!isLoginPage && loading) ? (
          <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ p: 3 }}>{children}</Box>
        )}
      </Box>
    </ThemeProvider>
  );
}
