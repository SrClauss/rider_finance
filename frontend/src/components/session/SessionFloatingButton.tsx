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
    
      <Box sx={{ mt: 1, display: "flex", justifyContent: "space-between", minWidth: 200 }}>
        {active ? (
          <>
            <Typography
              variant="caption"
              sx={{ fontWeight: "bold", color: "#00e676", flex: 1, textAlign: "left" }}
            >
              R$ {totals.ganhos.toFixed(2)}
            </Typography>
            <Typography
              variant="caption"
              sx={{ fontWeight: "bold", color: "#ff1744", flex: 1, textAlign: "right" }}
            >
              R$ {totals.gastos.toFixed(2)}
            </Typography>
          </>
        ) : (
          <Typography variant="caption" sx={{ color: "#ccc", width: "100%", textAlign: "center" }}>
            Iniciar sessão
          </Typography>
        )}
      </Box>
    </Box>
  );
}
