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
import LogoutIcon from "@mui/icons-material/Logout";
import { useRouter } from "next/navigation";
import { ThemeProvider } from "@/theme/ThemeProvider"; // Adjust the import path as necessary

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
      .catch((err) => {
        router.replace("/login");
      });
  }, []);

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
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Rider Finance
        </Typography>
      </Toolbar>
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
        <ListItem key="Perfil" disablePadding>
          <ListItemButton onClick={() => router.push("/perfil") }>
            <ListItemIcon>
              <AccountCircleIcon />
            </ListItemIcon>
            <ListItemText primary="Perfil" />
          </ListItemButton>
        </ListItem>
        <ListItem key="Sair" disablePadding>
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
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
            bgcolor: "#181c24"
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
        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
          aria-label="mailbox folders"
        >
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
        </Box>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 0,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            bgcolor: "#181c24",
            color: "#f5f5f5",
            minHeight: "100vh"
          }}
        >
          <Toolbar />
          <Box>
            {children}
          </Box>
          <Box component="footer" sx={{ mt: 4, textAlign: "center", color: "#888" }}>
            <small>© {new Date().getFullYear()} Rider Finance</small>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
