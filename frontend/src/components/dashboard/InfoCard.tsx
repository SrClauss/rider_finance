import { Box, Typography } from "@mui/material";
import { JSX, ReactNode } from "react";

export default function InfoCard({
  icon,
  title,
  value,
}: {
  icon: ReactNode;
  title: string; // Corrigido para aceitar string
  value: string | number;
}): JSX.Element {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          bgcolor: "background.paper",
          width: "8vh",
          height: "8vh",
          borderRadius: 1,
          boxShadow: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 1,
        }}
      >
        <Box sx={{ fontSize: 35 }}>{icon}</Box> {/* Define o tamanho do ícone aqui */}
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          maxWidth: 100,
        }}
      >
        <Typography
          variant="caption"
          marginBottom={1}
          color="text.secondary"
          sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: '0.7rem' }}
        >
          {title}
        </Typography>
        <Typography variant="caption" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: '0.9rem' }}>{value}</Typography>
      </Box>
    </Box>
  );
}
