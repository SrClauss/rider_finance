import React from "react";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { Box, Typography } from "@mui/material";
import AnimatedGpsIcon from "@/components/icons/AnimatedGpsIcon";

export default function RouteTransition({ message = "Carregando conteúdo..." }: { message?: string }) {
  return (
    <ThemeProvider>
      <Box sx={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, zIndex: 1300 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, width: '100%', maxWidth: 640 }}>
          <AnimatedGpsIcon width={140} height={140} duration={2.5} pauseOnHover />
          <Typography variant="h6" sx={{ textAlign: 'center' }}>
            {message}
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
