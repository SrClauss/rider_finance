"use client";
import axios from "axios";
import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ThemeProvider } from "@/theme/ThemeProvider";
import SessionFloatingPanel from '@/components/session/SessionFloatingPanel';
import { BottomNavigation, BottomNavigationAction, Paper, AppBar, Toolbar, Typography, Box, Container, IconButton } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import FlagIcon from "@mui/icons-material/Flag";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

const drawerWidth = 240;

interface LoggedLayoutProps {
  children: React.ReactNode;
}

const tabs = [
  { label: "Painel", icon: <DashboardIcon />, path: "/dashboard" },
  { label: "Transações", icon: <ReceiptLongIcon />, path: "/transactions" },
  { label: "Metas", icon: <FlagIcon />, path: "/goals" },
  { label: "Relatórios", icon: <AssessmentIcon />, path: "/relatorios" },
];

export default function LoggedLayout({ children }: LoggedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Encontra o índice da aba ativa
  const currentTab = tabs.findIndex(tab => pathname.startsWith(tab.path));
  const [value, setValue] = React.useState(currentTab === -1 ? 0 : currentTab);

  React.useEffect(() => {
    setValue(currentTab === -1 ? 0 : currentTab);
  }, [pathname, currentTab]);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    router.push(tabs[newValue].path);
  };

  return (
    <>
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar>
          <Typography variant="h6" color="inherit" sx={{ flexGrow: 1 }}>
            Rider Finance
          </Typography>
          <IconButton color="inherit" onClick={() => router.push("/perfil")}>
            <AccountCircleIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ paddingBottom: 10 }}>
        <Box sx={{ my: 0.5 }}>
          {children}
          <SessionFloatingPanel />
        </Box>
      </Container>
      <Paper sx={{ position: "fixed", bottom: 0, left: 0, right: 0 }} elevation={3}>
        <BottomNavigation showLabels value={value} onChange={handleChange}>
          {tabs.map((tab, idx) => (
            <BottomNavigationAction
              key={tab.path}
              label={tab.label.toUpperCase()}
              icon={tab.icon}
              sx={{
                minWidth: 'auto',
                padding: '6px 8px',
                '& .MuiBottomNavigationAction-label': {
                  fontSize: '0.5rem',
                  fontWeight: 500,
                },
              }}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </>
  );
  }
