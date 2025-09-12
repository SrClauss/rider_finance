"use client";
import React from "react";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { GlobalConfigProvider } from '@/context/GlobalConfigContext';
import { Box, AppBar, Toolbar, Typography, Button, CircularProgress, BottomNavigation, BottomNavigationAction, Container, useMediaQuery } from "@mui/material";
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import axios from "axios";
import { useRouter, usePathname } from "next/navigation";
import useAdminAuth from "@/hooks/useAdminAuth";
import ChangePasswordDialog from '@/components/admin/ChangePasswordDialog';

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

  const [changeOpen, setChangeOpen] = React.useState(false);

  const isLargeScreen = useMediaQuery('(min-width:960px)');

  const adminTabs = [
    { label: 'Painel', path: '/admin', icon: <DashboardIcon /> },
    { label: 'Usuários', path: '/admin/users', icon: <PeopleIcon /> },
    { label: 'Admins', path: '/admin/admins', icon: <PeopleIcon /> },
  ];

  const currentTab = adminTabs.findIndex((t) => pathname?.startsWith(t.path));
  const [value, setValue] = React.useState(currentTab === -1 ? 0 : currentTab);

  React.useEffect(() => {
    setValue(currentTab === -1 ? 0 : currentTab);
  }, [pathname, currentTab]);

  return (
    <ThemeProvider>
      <GlobalConfigProvider>
      <Container maxWidth={isLargeScreen ? 'lg' : false} sx={{ paddingBottom: 10 }}>
        <Box>
          {/* Apenas mostrar a AppBar quando NÃO estivermos na página de login */}
          {!isLoginPage && (
            <AppBar position="static" elevation={1} sx={{ backgroundColor: 'background.paper', color: 'text.primary' }}>
              <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Painel Admin</Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Button onClick={() => setChangeOpen(true)} startIcon={<AccountCircleIcon />}>Minha conta</Button>
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

          {/* Bottom navigation replicating LoggedLayout pattern with admin routes */}
          {!isLoginPage && (
            <Box>
              <BottomNavigation showLabels value={value} onChange={(_e, newValue) => { setValue(newValue); router.push(adminTabs[newValue].path); }} sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}>
                {adminTabs.map((tab) => (
                  <BottomNavigationAction key={tab.path} label={tab.label.toUpperCase()} icon={tab.icon} sx={{ minWidth: 'auto', padding: '6px 8px', '& .MuiBottomNavigationAction-label': { fontSize: '0.5rem', fontWeight: 500 } }} />
                ))}
              </BottomNavigation>
            </Box>
          )}
        </Box>
          </Container>
      </GlobalConfigProvider>
  <ChangePasswordDialog open={changeOpen} onClose={() => setChangeOpen(false)} />
    </ThemeProvider>
  );
}
