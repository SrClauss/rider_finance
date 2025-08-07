'use client'

import { createTheme } from '@mui/material/styles'

const colors = {
  black: '#000000',
  darkGray: '#121212',
  cardGray: '#1C1C1E',
  borderGray: '#2C2C2E',
  textGray: '#A1A1A3',
  green: '#2BD34F',
  lightGreen: '#30D158',
  red: '#FF3B30',
  blue: '#007AFF',
  orange: '#FF9500',
  purple: '#AF52DE',
  white: '#FFFFFF',
  lightGray: '#F2F2F7',
  mediumGray: '#8E8E93',
  darkText: '#1C1C1E',
}

export const createCustomTheme = (mode: 'light' | 'dark') => {
  const isDark = mode === 'dark'
  return createTheme({
    palette: {
      mode,
      primary: {
        main: colors.green,
        light: colors.lightGreen,
        dark: '#26B943',
        contrastText: isDark ? colors.black : colors.white,
      },
      secondary: {
        main: colors.blue,
        light: '#5AC8FA',
        dark: '#0066CC',
        contrastText: colors.white,
      },
      error: {
        main: colors.red,
        light: '#FF6961',
        dark: '#D70015',
        contrastText: colors.white,
      },
      warning: {
        main: colors.orange,
        light: '#FFCC02',
        dark: '#FF8C00',
        contrastText: colors.white,
      },
      success: {
        main: colors.lightGreen,
        light: '#63E6BE',
        dark: '#20C997',
        contrastText: colors.white,
      },
      background: {
        default: isDark ? colors.black : colors.lightGray,
        paper: isDark ? colors.cardGray : colors.white,
      },
      text: {
        primary: isDark ? colors.white : colors.darkText,
        secondary: isDark ? colors.textGray : colors.mediumGray,
        disabled: isDark ? '#3A3A3C' : '#C7C7CC',
      },
      divider: isDark ? colors.borderGray : '#E5E5EA',
      action: {
        hover: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
        selected: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        disabled: isDark ? 'rgba(255, 255, 255, 0.26)' : 'rgba(0, 0, 0, 0.26)',
        disabledBackground: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
      },
    },
    typography: {
      fontFamily: 'Inter, Roboto, Helvetica, Arial, sans-serif',
      h1: { fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em' },
      h2: { fontSize: '2rem', fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em' },
      h3: { fontSize: '1.75rem', fontWeight: 600, lineHeight: 1.3 },
      h4: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.4 },
      h5: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
      h6: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
      body1: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.5 },
      body2: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.43 },
      button: { fontSize: '0.875rem', fontWeight: 600, textTransform: 'none', letterSpacing: '0.02em' },
      caption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.33 },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDark ? colors.black : colors.lightGray,
            color: isDark ? colors.white : colors.darkText,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? colors.cardGray : colors.white,
            border: `1px solid ${isDark ? colors.borderGray : '#E5E5EA'}`,
            boxShadow: isDark 
              ? '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)'
              : '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            padding: '10px 24px',
            fontSize: '0.875rem',
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          },
          contained: {
            backgroundColor: colors.green,
            color: colors.black,
            '&:hover': { backgroundColor: '#26B943' },
          },
          outlined: {
            borderColor: isDark ? colors.borderGray : '#E5E5EA',
            color: isDark ? colors.white : colors.darkText,
            '&:hover': {
              borderColor: colors.green,
              backgroundColor: isDark ? 'rgba(43, 211, 79, 0.04)' : 'rgba(43, 211, 79, 0.04)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 8, fontSize: '0.75rem', fontWeight: 600 },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { borderRadius: 4, backgroundColor: isDark ? colors.borderGray : '#E5E5EA' },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? colors.darkGray : colors.white,
            borderRight: `1px solid ${isDark ? colors.borderGray : '#E5E5EA'}`,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? colors.darkGray : colors.white,
            borderBottom: `1px solid ${isDark ? colors.borderGray : '#E5E5EA'}`,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            margin: '2px 0',
            '&:hover': { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)' },
            '&.Mui-selected': {
              backgroundColor: isDark ? 'rgba(43, 211, 79, 0.12)' : 'rgba(43, 211, 79, 0.12)',
              '&:hover': { backgroundColor: isDark ? 'rgba(43, 211, 79, 0.16)' : 'rgba(43, 211, 79, 0.16)' },
            },
          },
        },
      },
    },
  })
}

export const darkTheme = createCustomTheme('dark')
export const lightTheme = createCustomTheme('light')

export const categoryColors = {
  uber: '#000000',
  '99': '#FFD700',
  indrive: '#0066FF',
  particular: colors.green,
  outros: colors.purple,
  combustivel: colors.red,
  manutencao: colors.orange,
  alimentacao: colors.blue,
  lazer: colors.purple,
  equipamentos: colors.mediumGray,
}
