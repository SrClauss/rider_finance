"use client";
import React, { useMemo } from "react";
import Fab from "@mui/material/Fab";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useSession } from "@/context/SessionContext";

export default function SessionFloatingButton() {
  const { sessaoAtual, loading, openStartModal, stop, totals } = useSession();

  const active = useMemo(() => !!sessaoAtual?.eh_ativa, [sessaoAtual]);

  return (
    <Box sx={{ position: "fixed", right: 24, bottom: 24, zIndex: 1400 }}>
      <Fab
        color={active ? "secondary" : "primary"}
        onClick={() => (active ? stop() : openStartModal())}
        disabled={loading}
        aria-label={active ? "Encerrar sessão" : "Iniciar sessão"}
      >
        {active ? <StopIcon /> : <PlayArrowIcon />}
      </Fab>
      <Box sx={{ mt: 1, textAlign: "center" }}>
        <Typography variant="caption" sx={{ color: "#ccc" }}>
          {active ? `Ativa • R$ ${totals.ganhos.toFixed(2)} / R$ ${totals.gastos.toFixed(2)}` : "Iniciar sessão"}
        </Typography>
      </Box>
    </Box>
  );
}
