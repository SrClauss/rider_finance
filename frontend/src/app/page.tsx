
"use client";

import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import axios from 'axios';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

const theme = createTheme({
  palette: {
    mode: 'light',
  },
  typography: {
    fontFamily: 'Inter, Roboto, Arial, sans-serif',
  },
});

export default function Home() {
  const [isValidToken, setIsValidToken] = useState(false);

  useEffect(() => {
    axios.get('/api/validate_token', { withCredentials: true })
      .then(response => {
        if (response.status === 200) {
          setIsValidToken(response.data.valid);
        }
      })
      .catch(error => {
        console.error('Error validating token:', error);
      });
  }, []);

  useEffect(() => {
    if (!isValidToken) {
      redirect('/login');
    }

    redirect('/dashboard');
  }, [isValidToken]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f3f4f6', p: 2 }}>
        <Box sx={{ textAlign: 'center', p: { xs: 3, sm: 5 }, borderRadius: 2, boxShadow: 3, bgcolor: 'background.paper', maxWidth: 760, width: '100%' }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Bem vindo ao GPS Financeiro
          </Typography>
          <Typography variant="body1" sx={{ mt: 1, mb: 2, color: 'text.secondary' }}>
            Sua dashboard financeira, em breve você será redirecionado.
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 1 }}>
            <CircularProgress color="primary" />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}