import React, { useState, useEffect } from 'react';
import { Goal } from '@/interfaces/goal';
import { GoalProgress } from './GoalProgress';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { SxProps, Theme } from '@mui/material';

interface GoalCardProps {
  goal: Goal;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goal: Goal) => void;
  sx?: SxProps<Theme>;
}

/**
 * Componente GoalCard: Exibe informações de uma meta em um card elegante.
 * Inclui título, tipo, descrição, valor alvo, datas e botões de ação.
 * Renderiza GoalProgress para mostrar o progresso da meta.
 */
const GoalCard: React.FC<GoalCardProps> = ({ goal, onEdit, onDelete, sx }) => {
  // Estado local para sincronizar com props
  const [localGoal, setLocalGoal] = useState<Goal>(goal);

  // Sincroniza estado local quando goal muda
  useEffect(() => {
    setLocalGoal(goal);
  }, [goal]);

  // Formata data para exibição
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } catch {
      return dateString;
    }
  };

  return (
    <Card
      elevation={3}
      sx={{
        borderRadius: 3,
        mb: 3,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        minHeight: 220,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        ...(sx || {}),
      }}
    >
      <CardContent
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 3,
        }}
      >
        {/* Cabeçalho com título e chip de tipo */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight={700} color="primary.main">
            {localGoal.titulo}
          </Typography>
          <Chip
            label={localGoal.tipo.charAt(0).toUpperCase() + localGoal.tipo.slice(1)}
            color={localGoal.tipo === 'faturamento' || localGoal.tipo === 'lucro' ? 'success' : 'error'}
            size="small"
            sx={{ fontWeight: 700 }}
          />
        </Box>

        {/* Botões de editar/excluir */}
        <Box display="flex" alignItems="center" justifyContent="flex-end" mb={1} gap={1}>
          <Tooltip title="Editar meta">
            <IconButton size="small" color="primary" onClick={() => onEdit?.(localGoal)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Excluir meta">
            <IconButton size="small" color="error" onClick={() => onDelete?.(localGoal)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Descrição opcional */}
        {localGoal.descricao && (
          <Typography variant="body2" color="text.secondary" mb={1}>
            {localGoal.descricao}
          </Typography>
        )}

        {/* Tipo de meta */}
        <Typography variant="caption" color="text.secondary" mb={2}>
          Tipo de meta: <strong>{localGoal.tipo.charAt(0).toUpperCase() + localGoal.tipo.slice(1)}</strong>
        </Typography>

        <Divider sx={{ my: 1, bgcolor: 'divider' }} />

        {/* Valor alvo e datas */}
        <Box display="flex" flexDirection="column" gap={1} mb={2}>
          <Typography variant="body2" color="text.secondary">
            <strong>Valor alvo:</strong> {(localGoal.valor_alvo / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </Typography>
          <Box>
            <Typography variant="body2" color="text.secondary">
              <strong>Início:</strong> {formatDate(localGoal.data_inicio)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Fim:</strong> {formatDate(localGoal.data_fim)}
            </Typography>
          </Box>
        </Box>

        {/* Componente de progresso */}
        <GoalProgress meta={localGoal} isActive={localGoal.eh_ativa} />
      </CardContent>
    </Card>
  );
};

export default GoalCard;
