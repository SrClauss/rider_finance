import React, { useState, useMemo, useReducer } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Transaction } from '@/interfaces/Transaction';
import { useCategoriaContext } from '@/context/CategoriaContext';
import { useMetasContext } from '@/context/MetasContext';
import { getCurrentDateTime, formatForDateTimeLocal, parseDateTime, toBackendLocalString } from '@/utils/dateUtils';
import { useSession } from '@/context/SessionContext';
import axios from 'axios';

// Import FontAwesome CSS (certifique-se de que está instalado)
import '@fortawesome/fontawesome-free/css/all.min.css';

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  onEdited?: () => void;
  transaction?: Transaction | null;
}

// Estado inicial do formulário
interface FormState {
  valor: string;
  tipo: string;
  descricao: string;
  id_categoria: string;
  data: string;
}

// Ações do reducer
type FormAction =
  | { type: 'SET_VALOR'; payload: string }
  | { type: 'SET_TIPO'; payload: string }
  | { type: 'SET_DESCRICAO'; payload: string }
  | { type: 'SET_CATEGORIA'; payload: string }
  | { type: 'SET_DATA'; payload: string }
  | { type: 'RESET_FORM' }
  | { type: 'LOAD_TRANSACTION'; payload: Transaction };

// Função para obter data/hora local no formato correto para datetime-local
const getCurrentLocalDateTime = () => {
  return formatForDateTimeLocal(new Date());
};
const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'SET_VALOR':
      return { ...state, valor: action.payload };
    case 'SET_TIPO':
      return { ...state, tipo: action.payload };
    case 'SET_DESCRICAO':
      return { ...state, descricao: action.payload };
    case 'SET_CATEGORIA':
      return { ...state, id_categoria: action.payload };
    case 'SET_DATA':
      return { ...state, data: action.payload };
    case 'RESET_FORM':
      return {
        valor: '',
        tipo: '',
        descricao: '',
        id_categoria: '',
        data: getCurrentLocalDateTime(), // Usar função que retorna data/hora local correta
      };
    case 'LOAD_TRANSACTION':
      const transaction = action.payload;
      return {
        valor: transaction.valor ? transaction.valor.toString() : '',
        tipo: transaction.tipo || '',
        descricao: transaction.descricao || '',
        id_categoria: transaction.id_categoria || '',
        data: transaction.data
          ? formatForDateTimeLocal(parseDateTime(transaction.data)) // Formato YYYY-MM-DDTHH:mm para datetime-local sem shift
          : getCurrentLocalDateTime(), // Usar função que retorna data/hora local correta
      };
    default:
      return state;
  }
};

/**
 * Modal para criação e edição de transações
 * Componente visual sem lógica de estado
 */
const TransactionModal: React.FC<TransactionModalProps> = ({
  open,
  onClose,
  transaction,
}) => {
  const isEditing = Boolean(transaction);
  const { categorias } = useCategoriaContext();
  const { dispatchTransacoes } = useMetasContext();

  // Estado do formulário usando reducer
  const [formState, dispatch] = useReducer(formReducer, {
    valor: '',
    tipo: '',
    descricao: '',
    id_categoria: '',
    data: getCurrentLocalDateTime(), // Usar função que retorna data/hora local correta
  });

  // Carregar transação para edição quando o modal abrir ou quando a transação mudar
  React.useEffect(() => {
    if (transaction && open) {
      dispatch({ type: 'LOAD_TRANSACTION', payload: transaction });
    } else if (!transaction && open) {
      dispatch({ type: 'RESET_FORM' });
    }
  }, [transaction, open]);

  // Efeito adicional para garantir que a transação seja carregada quando o componente montar
  React.useEffect(() => {
    if (transaction && open) {
      dispatch({ type: 'LOAD_TRANSACTION', payload: transaction });
    }
  }, []); // Executa apenas uma vez quando o componente montar

  const selectedCategoria = useMemo(
    () => categorias.find((c) => c.id === formState.id_categoria) ?? null,
    [categorias, formState.id_categoria]
  );

  const { attachTransaction, sessao } = useSession();

  // Verificar se há sessão ativa
  const hasActiveSession = sessao && sessao.sessao && sessao.sessao.eh_ativa;

  // Função para submeter o formulário
  const handleSubmit = async () => {
    // Validações básicas
    if (!formState.id_categoria) {
      alert('Categoria inválida');
      return;
    }

    try {
      // Se há sessão ativa, usar a data/hora atual em vez da selecionada
      const dataToSend = hasActiveSession
        ? toBackendLocalString(new Date())
        : (() => {
            // Para datetime-local, criar data local sem timezone
            const [datePart, timePart] = formState.data.split('T');
            return `${datePart}T${timePart}:00`;
          })();

      const payload = {
        id_categoria: formState.id_categoria,
        valor: Number(Math.round(parseFloat(formState.valor) * 100)), // Garantir que seja number
        tipo: selectedCategoria?.tipo || '', // Tipo vem da categoria selecionada
        descricao: formState.descricao || undefined, // Usar undefined em vez de null para Option<String>
        data: dataToSend, // Usar data atual se sessão ativa, senão usar a selecionada
      };

      let response;
      if (isEditing && transaction) {
        // Update
        response = await axios.put(`/api/transacao/${transaction.id}`, payload, {
          withCredentials: true,
        });
      } else {
        // Create
        response = await axios.post('/api/transacao', payload, {
          withCredentials: true,
        });
      }

      // Sucesso: atualizar contextos e fechar modal
      const savedTransaction = response.data;
      if (isEditing) {
        // TODO: dispatch update
        dispatchTransacoes(savedTransaction, 'update');
      } else {
        // Dispatch add para MetasContext
        dispatchTransacoes(savedTransaction, 'add');
        if (attachTransaction) {
          attachTransaction(savedTransaction); // Anexa à sessão se ativa
        }
      }
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      alert('Erro ao salvar transação. Tente novamente.');
    }
  };

  // Função para limpar o formulário
  const handleClose = () => {
    dispatch({ type: 'RESET_FORM' });
    onClose();
  };

  // Função para renderizar ícone FontAwesome
  const renderIcon = (icone: string | undefined, color?: string, size: string = '1.2em') => {
    if (!icone) return null;

    return (
      <Box
        component="i"
        className={icone}
        sx={{
          fontSize: size,
          lineHeight: 1,
          minWidth: size,
          display: 'inline-block',
          textAlign: 'center',
          color: color || 'inherit'
        }}
      />
    );
  };

  // Função para renderizar o tipo com cor
  const renderTipo = (tipo: string | undefined) => {
    if (!tipo) return null;

    const isReceita = tipo === 'entrada';
    return (
      <Typography
        variant="caption"
        sx={{
          color: isReceita ? 'success.main' : 'error.main',
          fontWeight: 700,
          fontSize: '0.75rem',
        }}
      >
        {isReceita ? 'RECEITA' : 'DESPESA'}
      </Typography>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: 500,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        <Typography 
          variant="h6" 
          component="span" 
          fontWeight={700} 
          color="primary.main"
        >
          {isEditing ? 'Editar Transação' : 'Nova Transação'}
        </Typography>
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{ color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          {/* Campo Valor */}
          <TextField
            label="Valor (R$)"
            type="number"
            fullWidth
            variant="outlined"
            placeholder="0,00"
            value={formState.valor}
            onChange={(e) => dispatch({ type: 'SET_VALOR', payload: e.target.value })}
            slotProps={{
              input: {
                sx: { borderRadius: 2 },
              },
            }}
          />

          {/* Campo Descrição */}
          <TextField
            label="Descrição"
            fullWidth
            variant="outlined"
            placeholder="Descrição da transação"
            multiline
            rows={2}
            value={formState.descricao}
            onChange={(e) => dispatch({ type: 'SET_DESCRICAO', payload: e.target.value })}
            slotProps={{
              input: {
                sx: { borderRadius: 2 },
              },
            }}
          />

          {/* Campo Categoria (ícone FontAwesome + nome + tipo nas opções) */}
          <FormControl fullWidth variant="outlined">
            <InputLabel>Categoria</InputLabel>
            <Select
              label="Categoria"
              value={formState.id_categoria}
              onChange={(e) => dispatch({ type: 'SET_CATEGORIA', payload: e.target.value as string })}
              renderValue={(val) => {
                const cat = categorias.find((c) => c.id === val);
                if (!cat) return <Typography color="text.secondary">Selecione uma categoria</Typography>;
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {renderIcon(cat.icone || undefined, cat.cor || undefined)}
                    <Typography sx={{ ml: 1 }}>{cat.nome}</Typography>
                    {renderTipo(cat.tipo)}
                  </Box>
                );
              }}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">
                <Typography color="text.secondary">Selecione uma categoria</Typography>
              </MenuItem>
              {categorias.map((categoria) => (
                <MenuItem key={categoria.id} value={categoria.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    {/* Ícone FontAwesome antes do nome */}
                    {renderIcon(categoria.icone || undefined, categoria.cor || undefined)}
                    
                    {/* Nome da categoria */}
                    <Typography sx={{ ml: 1 }}>{categoria.nome}</Typography>

                    {/* Tipo no canto direito */}
                    <Box sx={{ ml: 'auto' }}>
                      {renderTipo(categoria.tipo)}
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Campo Data e Hora */}
          <TextField
            label="Data e Hora"
            type="datetime-local"
            fullWidth
            variant="outlined"
            value={formState.data}
            onChange={(e) => dispatch({ type: 'SET_DATA', payload: e.target.value })}
            slotProps={{
              inputLabel: {
                shrink: true,
              },
              input: {
                sx: { borderRadius: 2 },
              },
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          color="inherit"
          sx={{
            borderRadius: 2,
            px: 3,
            fontWeight: 600,
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          sx={{
            borderRadius: 2,
            px: 3,
            fontWeight: 600,
          }}
        >
          {isEditing ? 'Salvar' : 'Criar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransactionModal;
