"use client";
import React, { useState } from 'react';
import { useSession } from '@/context/SessionContext';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useTheme } from '@mui/material/styles';
import StartSessionModal from '@/modals/StartSessionModal';
import StopSessionModal from '@/modals/StopSessionModal';

export default function SessionFloatingPanel() {
  const { sessao, elapsedSeconds, start, stop, loading } = useSession();
  const theme = useTheme();
  const { panelOpen, setPanelOpen } = useSession();
  const open = panelOpen ?? false;
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [stopModalOpen, setStopModalOpen] = useState(false);
  // Fixed panel height to keep implementation simple and predictable
  const PANEL_HEIGHT = 180; // px

  const fmt = (s: number) => {
    const hh = Math.floor(s / 3600).toString().padStart(2, '0');
    const mm = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const ss = Math.floor(s % 60).toString().padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  };

  // calcular totais de receitas (entrada) e despesas (saida)
  const totals = React.useMemo(() => {
    const trans = sessao?.transacoes ?? [];
    let entradas = 0;
    let saidas = 0;
    for (const t of trans) {
      const v = Number(t?.valor ?? 0) || 0;
      if (t?.tipo === 'entrada') entradas += v;
      else if (t?.tipo === 'saida') saidas += v;
    }
    return { entradas, saidas };
  }, [sessao?.transacoes]);

  const fmtCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v / 100);

  return (
    <Box
      sx={{
        position: 'fixed',
        right: 24,
        bottom: 100,
        zIndex: theme.zIndex.drawer + 2,
        display: 'flex',
        // quando aberto a handle ocupa a altura do painel; quando fechado, alinhamos ao fundo e mostramos um quadrado
        alignItems: open ? 'stretch' : 'flex-end',
        gap: 0, // sem espaço entre handle e painel para ficarem encostados
      }}
    >
      {/* vertical handle - fica à esquerda do painel */}
    <Box
  role="button"
  tabIndex={0}
  aria-expanded={open}
  aria-controls="rf-session-panel"
  onClick={() => setPanelOpen && setPanelOpen(!open)}
  onKeyDown={(e: React.KeyboardEvent) => { 
    if (e.key === 'Enter' || e.key === ' ') { 
      e.preventDefault(); 
      setPanelOpen?.(!open); 
    } 
  }}
        sx={{
          // quando aberto: barra vertical; quando fechado: quadrado pequeno
          width: open ? 36 : 40,
          height: open ? PANEL_HEIGHT : 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(10,14,20,1)' : 'rgba(248,249,250,1)',
          opacity: open ? 1 : 0.45,
          // quando aberto, handle arredondado à esquerda; quando fechado, quadrado com cantos arredondados
          borderRadius: open ? '6px 0 0 6px' : '8px',
          boxShadow: 1,
          cursor: 'pointer',
          transition: 'width 200ms ease, height 200ms ease, border-radius 160ms ease, opacity 160ms',
          border: theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.06)',
          // remove borda direita quando estiver encaixado no painel aberto
          borderRight: open ? 'none' : undefined,
        }}
      >
        <IconButton size="small" aria-label={open ? 'recolher painel' : 'expandir painel'}>
          {/* inverter a rotação: quando aberto mostramos a seta apontando para a direita (expande para fora), quando fechado aponta para a esquerda */}
          <ChevronRightIcon sx={{ transform: open ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 160ms', fontSize: open ? 'default' : 20 }} />
        </IconButton>
      </Box>

      {/* painel principal - largura varia com estado */}
      <Paper
        id="rf-session-panel"
        elevation={6}
        sx={{
          width: open ? 300 : 0,
          p: open ? 2 : 0,
          height: PANEL_HEIGHT,
          overflow: 'hidden',
          transition: 'width 220ms ease, padding 180ms ease',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          // fundo sólido
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(15,23,32,1)' : 'rgba(255,255,255,1)',
      // quando aberto, a borda esquerda deve ser quadrada para "encaixar" na barra; quando fechado, manter borda arredondada
      borderRadius: open ? '0 8px 8px 0' : 2,
      border: theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.06)',
      borderLeft: 'none', // remove borda esquerda para ficar conZtínuo com o handle
  }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon sx={{ fontSize: 18 }} />
              <Typography variant="body2" sx={{ fontWeight: 700 }}>Sessão</Typography>
          </Box>

            <Box sx={{
              display: 'flex',
              alignItems: 'stretch',
              justifyContent: 'center',
              width: '100%',
              gap: 0,
            }}>
              {/* coluna esquerda: status + tempo */}
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                minWidth: 80,
                maxWidth: 80,
                flex: '0 0 110px',
                alignItems: 'flex-start',
                justifyContent: 'center',
              }}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Typography variant="body2" noWrap sx={{ fontWeight: 600, fontSize: '0.95rem' }}>{sessao && sessao.sessao && sessao.sessao.eh_ativa ? 'Ativa' : 'Inativa'}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>Tempo</Typography>
                <Typography variant="body2" noWrap sx={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.95rem' }}>{fmt(elapsedSeconds ?? 0)}</Typography>
              </Box>

              {/* coluna central: botão sempre centralizado */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 2,
                minWidth: 80,
                maxWidth: 80,
                flex: '0 0 80px',
              }}>
                {!sessao || !sessao.sessao || !sessao.sessao.eh_ativa ? (
                  <IconButton
                    aria-label="Iniciar sessão"
                    size="medium"
                    onClick={() => setStartModalOpen(true)}
                    disabled={loading}
                    sx={{
                      width: 50,
                      height: 50,
                      bgcolor: theme.palette.success.main,
                      color: '#fff',
                      '&:hover': { bgcolor: theme.palette.success.dark },
                      boxShadow: 1,
                    }}
                  >
                    <PlayArrowIcon fontSize="medium" />
                  </IconButton>
                ) : (
                  <IconButton
                    aria-label="Parar sessão"
                    size="medium"
                    onClick={() => setStopModalOpen(true)}
                    disabled={loading}
                    sx={{
                      width: 50,
                      height: 50,
                      bgcolor: theme.palette.error.main,
                      color: '#fff',
                      '&:hover': { bgcolor: theme.palette.error.dark },
                      boxShadow: 1,
                    }}
                  >
                    <StopIcon fontSize="medium" />
                  </IconButton>
                )}
              </Box>

              {/* coluna direita: receitas/despesas */}
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                minWidth: 80,
                maxWidth: 80,
                flex: '0 0 110px',
                alignItems: 'flex-start',
                justifyContent: 'center',
              }}>
                <Typography variant="caption" color="text.secondary">Receitas</Typography>
                <Typography variant="body2" noWrap sx={{ color: theme.palette.success.main, fontWeight: 600, fontSize: '0.95rem' }}>{fmtCurrency(totals.entradas)}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>Despesas</Typography>
                <Typography variant="body2" noWrap sx={{ color: theme.palette.error.main, fontWeight: 600, fontSize: '0.95rem' }}>{fmtCurrency(totals.saidas)}</Typography>
              </Box>
            </Box>
        </Box>
      </Paper>

      {/* Modais */}
      <StartSessionModal
        open={startModalOpen}
        onClose={() => setStartModalOpen(false)}
      />
      <StopSessionModal
        open={stopModalOpen}
        onClose={() => setStopModalOpen(false)}
      />
    </Box>
  );
}
