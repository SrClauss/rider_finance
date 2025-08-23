"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box, Typography, Avatar, List, ListItem, ListItemText, Divider, Switch, IconButton, CircularProgress, Button
} from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import LoggedLayout from "@/layouts/LoggedLayout";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { Accordion, AccordionSummary, AccordionDetails, Card, CardContent } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { UsuarioMeResponse } from "@/interfaces/UsuarioMeResponse";

export default function PerfilPage() {
  const [usuario, setUsuario] = useState<UsuarioMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    axios.get("/api/me", { withCredentials: true })
      .then(res => {
        setUsuario(res.data);
        setLoading(false);
      })
      .catch(() => {
        setErro("Erro ao carregar dados do perfil.");
        setLoading(false);
      });
  }, []);

  const valorAssinatura = usuario?.configuracoes.find(c => c.chave === "valor_assinatura")?.valor;

  return (
    <LoggedLayout>
      <pre>{JSON.stringify(usuario, null, 2)}</pre>
    </LoggedLayout>
  );
}
