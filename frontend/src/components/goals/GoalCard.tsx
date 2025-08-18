import React from 'react';
import { Goal } from '@/interfaces/goal';
import { GoalProgress } from '../../components/goals/GoalProgress';
import { Card, CardContent, Typography, Box, Chip, Divider, IconButton, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { useEffect } from 'react';

interface GoalCardProps {
  goal: Goal;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goal: Goal) => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onEdit, onDelete }) => {
  const [localGoal, setLocalGoal] = React.useState(goal);

  useEffect(() => {
    setLocalGoal(goal);
  }, [goal]);

  useEffect(() => {
    if (!localGoal.eh_concluida && localGoal.eh_ativa) {
      const now = new Date();
      const dataFim = localGoal.data_fim ? new Date(localGoal.data_fim) : null;
      const isExpired = dataFim && now > dataFim;
      const isPositive = localGoal.tipo === 'faturamento' || localGoal.tipo === 'lucro';
      const progress = localGoal.valor_alvo > 0 ? (localGoal.valor_atual / localGoal.valor_alvo) * 100 : 0;
      const isCompleted = isPositive ? progress >= 100 : progress <= 0;

      // Se meta foi atingida (concluída), faz update normalmente
      if (isCompleted && !localGoal.eh_concluida) {
        const payload: any = {
          titulo: localGoal.titulo,
          descricao: localGoal.descricao ?? null,
          tipo: localGoal.tipo,
          categoria: localGoal.categoria,
          valor_alvo: localGoal.valor_alvo,
          valor_atual: localGoal.valor_atual,
          unidade: localGoal.unidade ?? null,
          data_inicio: localGoal.data_inicio ? localGoal.data_inicio.slice(0, 19) : null,
          data_fim: localGoal.data_fim ? localGoal.data_fim.slice(0, 19) : null,
          eh_ativa: localGoal.eh_ativa,
          eh_concluida: true,
          concluida_em: localGoal.concluida_em ?? null,
          concluida_com: localGoal.valor_atual
        };
        axios.put(`/api/meta/${localGoal.id}`, payload).then(() => {
          setLocalGoal(prev => ({ ...prev, eh_concluida: true, concluida_com: localGoal.valor_atual }));
        });
      }

      // Se meta expirou (fim do prazo), faz update normalmente
      if (isExpired && localGoal.eh_ativa) {
        const payload2: any = {
          titulo: localGoal.titulo,
          descricao: localGoal.descricao ?? null,
          tipo: localGoal.tipo,
          categoria: localGoal.categoria,
          valor_alvo: localGoal.valor_alvo,
          valor_atual: localGoal.valor_atual,
          unidade: localGoal.unidade ?? null,
          data_inicio: localGoal.data_inicio ? localGoal.data_inicio.slice(0, 19) : null,
          data_fim: localGoal.data_fim ? localGoal.data_fim.slice(0, 19) : null,
          eh_ativa: false,
          eh_concluida: localGoal.eh_concluida,
          concluida_em: localGoal.concluida_em ?? null,
          concluida_com: localGoal.valor_atual
        };
        axios.put(`/api/meta/${localGoal.id}`, payload2).then(() => {
          setLocalGoal(prev => ({ ...prev, eh_ativa: false, concluida_com: localGoal.valor_atual }));
        });
      }
    }
  }, [localGoal]);

  // Sempre renderiza o layout completo, GoalProgress decide o que mostrar
  return (
    <Card elevation={3} sx={{ borderRadius: 3, mb: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', minHeight: 220, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
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
