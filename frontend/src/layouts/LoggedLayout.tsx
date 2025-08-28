"use client";
import axios from "axios";
import React, { useEffect } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ListAltIcon from "@mui/icons-material/ListAlt";
import InsertChartIcon from "@mui/icons-material/InsertChart";
import FlagIcon from "@mui/icons-material/Flag";
import LogoutIcon from "@mui/icons-material/Logout";
import { useRouter } from "next/navigation";
import { ThemeProvider } from "@/theme/ThemeProvider"; // Adjust the import path as necessary
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { MetasProvider } from "../context/MetasContext";
import SessionFloatingButton from "@/components/session/SessionFloatingButton";
import { SessionProvider } from "@/context/SessionContext";
import StartSessionModal from "@/modals/StartSessionModal";

const drawerWidth = 240;

interface LoggedLayoutProps {
  children: React.ReactNode;
}

export default function LoggedLayout({ children }: LoggedLayoutProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const router = useRouter();

  useEffect(() => {

    axios.get("/api/validate_token", { withCredentials: true })
      .then(res => {
        if (!res.data || !res.data.valid) {
          router.replace("/login");


        }
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  const handleLogout = () => {
    axios.post("/api/logout", {}, { withCredentials: true })
      .then(() => {
        window.location.href = "/login";
      });
  };

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        <ListItem key="Dashboard" disablePadding>
          <ListItemButton onClick={() => router.push("/") }>
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>
        <ListItem key="Transacoes" disablePadding>
          <ListItemButton onClick={() => router.push("/transactions") }>
            <ListItemIcon>
              <ListAltIcon />
            </ListItemIcon>
            <ListItemText primary="Transações" />
          </ListItemButton>
        </ListItem>
        <ListItem key="Sessoes" disablePadding>
          <ListItemButton onClick={() => router.push("/sessoes") }>
            <ListItemIcon>
              <AccessTimeIcon />
            </ListItemIcon>
            <ListItemText primary="Sessões" />
          </ListItemButton>
        </ListItem>
        <ListItem key="Relatorios" disablePadding>
          <ListItemButton onClick={() => router.push("/relatorios") }>
            <ListItemIcon>
              <InsertChartIcon />
            </ListItemIcon>
            <ListItemText primary="Relatórios" />
          </ListItemButton>
        </ListItem>
        <ListItem key="Metas" disablePadding>
          <ListItemButton onClick={() => router.push("/goals") }>
            <ListItemIcon>
              <FlagIcon />
            </ListItemIcon>
            <ListItemText primary="Metas" />
          </ListItemButton>
        </ListItem>
        <ListItem key="Perfil" disablePadding>
          <ListItemButton onClick={() => router.push("/perfil") }>
            <ListItemIcon>
              <AccountCircleIcon />
            </ListItemIcon>
            <ListItemText primary="Perfil" />
          </ListItemButton>
        </ListItem>
        <ListItem key="Logout" disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Sair" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  return (
    <ThemeProvider>
      <MetasProvider>
        <SessionProvider>
          <Box sx={{ display: "flex" }}>
          <CssBaseline />
          <AppBar
            position="fixed"
            sx={{
              width: { sm: `calc(100% - ${drawerWidth}px)` },
              ml: { sm: `${drawerWidth}px` },
            }}
          >
            <Toolbar>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, display: { sm: "none" } }}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" noWrap component="div">
                Rider Finance
              </Typography>
            </Toolbar>
          </AppBar>
          {/* Drawer para mobile */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: "block", sm: "none" },
              "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth }
            }}
          >
            {drawer}
          </Drawer>
          {/* Drawer para desktop */}
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", sm: "block" },
              "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth }
            }}
            open
          >
            {drawer}
          </Drawer>
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              width: { sm: `calc(100% - ${drawerWidth}px)` },
              bgcolor: "#181c24",
              color: "#f5f5f5",
              minHeight: "100vh",
              pl: { sm: `${drawerWidth}px` }, // Garante espaço para a sidebar
              boxSizing: 'border-box',
              transition: 'padding-left 0.2s',
            }}
          >
            <Toolbar />
            <Box>
              {children}
            </Box>
            <SessionFloatingButton />
            <StartSessionModal />
            <Box component="footer" sx={{ mt: 4, textAlign: "center", color: "#888" }}>
              <small>© {new Date().getFullYear()} Rider Finance</small>
            </Box>
          </Box>
          </Box>
        </SessionProvider>
      </MetasProvider>
    </ThemeProvider>
  );
}
