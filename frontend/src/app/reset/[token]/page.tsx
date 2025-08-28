import React from "react";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { Container, Box } from "@mui/material";
import ResetForm from "@/components/ResetForm";

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return (
    <ThemeProvider>
      <Container maxWidth="sm">
        <Box display="flex" alignItems="center" justifyContent="center" minHeight="70vh">
          <ResetForm token={token} />
        </Box>
      </Container>
    </ThemeProvider>
  );
}
