"use client";
import axios from "axios";
import React from "react";
import { useRouter, usePathname } from "next/navigation";
import SessionFloatingPanel from "@/components/session/SessionFloatingPanel";
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  IconButton,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import GpsIcon from "@/components/icons/GPSIcon";

// drawerWidth removed as it wasn't used

interface LoggedLayoutProps {
  children: React.ReactNode;
}

const tabs = [
  { label: "Painel", icon: <DashboardIcon />, path: "/dashboard" },
  { label: "Transações", icon: <CreditCardIcon />, path: "/transactions" },
  { label: "Metas", icon: <GpsFixedIcon />, path: "/goals" },
  { label: "Relatórios", icon: <AssessmentIcon />, path: "/relatorios" },
];

export default function LoggedLayout({ children }: LoggedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isLargeScreen = useMediaQuery("(min-width:960px)"); // Verificar se é uma tela grande

  // Encontra o índice da aba ativa
  const currentTab = tabs.findIndex((tab) => pathname.startsWith(tab.path));
  const [value, setValue] = React.useState(currentTab === -1 ? 0 : currentTab);

  React.useEffect(() => {
    setValue(currentTab === -1 ? 0 : currentTab);
  }, [pathname, currentTab]);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    router.push(tabs[newValue].path);
  };

  const handleLogout = async () => {
    try {
      await axios.post("/api/logout");
      router.push("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      // Mesmo com erro, redireciona para login
      router.push("/login");
    }
  };

  return (
    <Container maxWidth={isLargeScreen ? "lg" : false} sx={{ paddingBottom: 10 }}>
      <AppBar position="static" color="default" elevation={0} sx={{ bgcolor: "background.paper" }}>
        <Toolbar>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <GpsIcon
                scale={4}
                gradient={["#d4af37", "#f7e7b6", "#d4af37"]}
                gradientType="linear"
              />
              <Box>
                <Typography variant="h6" component="div">
                  GPS Financeiro
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Seu guia financeiro
                </Typography>
              </Box>
            </Box>

            <Box>
            
              <IconButton
                color="inherit"
                onClick={() => router.push("/perfil")}
                sx={{ color: "#fff" }}
              >
                <AccountCircleIcon />
              </IconButton>
              <IconButton
                color="inherit"
                onClick={handleLogout}
                sx={{ color: "#fff" }}
              >
                <LogoutIcon />
              </IconButton>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      <Box sx={{ my: 0.5 }}>
        {children}
        <SessionFloatingPanel />
      </Box>
      <Paper
        sx={{ position: "fixed", bottom: 0, left: 0, right: 0 }}
        elevation={3}
      >
        <BottomNavigation showLabels value={value} onChange={handleChange}>
          {tabs.map((tab) => (
            <BottomNavigationAction
              key={tab.path}
              label={tab.label.toUpperCase()}
              icon={tab.icon}
              sx={{
                minWidth: "auto",
                padding: "6px 8px",
                "& .MuiBottomNavigationAction-label": {
                  fontSize: "0.5rem",
                  fontWeight: 500,
                },
              }}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Container>
  );
}
