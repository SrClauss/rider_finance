import React, { useEffect } from 'react';
import useFormReducer from '@/lib/useFormReducer';
import { Goal } from '@/interfaces/goal';
import { GoalProgress } from '../../components/goals/GoalProgress';
import { Card, CardContent, Typography, Box, Chip, Divider, IconButton, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useMetasContext } from '../../context/MetasContext';


import type { SxProps, Theme } from '@mui/material';

interface GoalCardProps {
  goal: Goal;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goal: Goal) => void;
  sx?: SxProps<Theme>;
}


const GoalCard: React.FC<GoalCardProps> = ({ goal, onEdit, onDelete, sx }) => {
  const { atualizarMeta } = useMetasContext();
  // Use useFormReducer for a consistent local state shape
  const { state: localGoal, setState: setLocalGoal } = useFormReducer<Goal>(goal as any);

  useEffect(() => {
    setLocalGoal(goal as any);
  }, [goal]);

  // Exemplo: se quiser atualizar meta por ação local, use atualizarMeta(metaAtualizada)

  // Sempre renderiza o layout completo, GoalProgress decide o que mostrar
  return (
    <Card elevation={3} sx={{ borderRadius: 3, mb: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', minHeight: 220, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', ...(sx || {}) }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 3 }}>
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
        {/* Botões discretos de editar/excluir */}
        <Box display="flex" alignItems="center" justifyContent="flex-end" mb={1} gap={1}>
          <Tooltip title="Editar">
            <IconButton size="small" color="primary" onClick={() => onEdit && onEdit(localGoal)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Excluir">
            <IconButton size="small" color="error" onClick={() => onDelete && onDelete(localGoal)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        {localGoal.descricao && (
          <Typography variant="body2" color="text.secondary" mb={1}>
            {localGoal.descricao}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary" mb={2}>
          Tipo de meta: <strong>{localGoal.tipo.charAt(0).toUpperCase() + localGoal.tipo.slice(1)}</strong>
        </Typography>
        <Divider sx={{ my: 1, bgcolor: 'divider' }} />
        <Box display="flex" flexDirection="row" gap={2} mb={2}>
          <Typography variant="body2" color="text.secondary">
            <strong>Valor alvo:</strong> R$ {localGoal.valor_alvo.toLocaleString('pt-BR')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Período:</strong> {localGoal.data_inicio ? new Date(localGoal.data_inicio).toLocaleDateString('pt-BR') : '-'}
            {localGoal.data_fim ? ` até ${new Date(localGoal.data_fim).toLocaleDateString('pt-BR')}` : ''}
          </Typography>
        </Box>
  <GoalProgress meta={localGoal} isActive={localGoal.eh_ativa} />
      </CardContent>
    </Card>
  );
};

export default GoalCard;
