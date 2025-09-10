import React, { use, useMemo } from 'react';
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
import { useUsuarioContext } from '@/context/UsuarioContext';
import { useMetasContext } from '@/context/MetasContext';
import { useSession } from '@/context/SessionContext';
import { timeZones, getCurrentDateTime, formatDateToUtc, getCurrentUtcDateTime, parseUtcToDate, convertToUtc } from '@/utils/dateUtils';
import axios from '@/utils/axiosConfig';
import useFormReducer from '@/lib/useFormReducer';
import { extractErrorMessage } from '@/lib/errorUtils';
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
  eventos?: string;
  [key: string]: unknown;
}

// Ações do reducer
// FormAction removed — using useFormReducer

// Função para obter data/hora local no formato correto para datetime-local
// reducer replaced by useFormReducer (see bottom)

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
  const { categorias } = useUsuarioContext();
  const { dispatchTransacoes } = useMetasContext();
  const timezone = timeZones[useUsuarioContext().configuracoes.find(c => c.chave === 'time_zone')?.valor || 'America/Sao_Paulo (UTC-03:00)'];

  // Estado do formulário usando useFormReducer
  // Para o campo datetime-local, precisamos de formato YYYY-MM-DDTHH:mm
  const getLocalDateTimeString = () => {
    const now = getCurrentDateTime(timezone);
    return now.toISOString().slice(0, 16);
  };

  const { state: formState, setField, reset, setError, setLoading } = useFormReducer<FormState>({
    valor: '',
    tipo: '',
    descricao: '',
    id_categoria: '',
    data: getLocalDateTimeString(),
    eventos: '1',
  });

  // Carregar transação para edição quando o modal abrir ou quando a transação mudar
  React.useEffect(() => {
    let mounted = true;
    if (transaction && open) {
      if (!mounted) return;
      setField('valor', transaction.valor ? String(transaction.valor / 100) : '');
      setField('tipo', transaction.tipo || '');
      setField('descricao', transaction.descricao || '');
      setField('id_categoria', transaction.id_categoria || '');
      
      // Para edição: converter UTC do backend para formato local datetime-local
      if (transaction.data) {
        const localDate = parseUtcToDate(transaction.data, timezone);
        setField('data', localDate.toISOString().slice(0, 16));
      } else {
        setField('data', getLocalDateTimeString());
      }
      
      setField('eventos', transaction.eventos ? String(transaction.eventos) : '1');
    } else if (!transaction && open) {
      reset();
    }
    return () => { mounted = false; };
  }, [transaction, open, setField, reset]);

  // (efeito duplicado removido)

  const selectedCategoria = useMemo(() => categorias.find((c) => c.id === formState.id_categoria) ?? null, [categorias, formState.id_categoria]);

  const { attachTransaction, sessao } = useSession();

  // Verificar se há sessão ativa
  const hasActiveSession = sessao && sessao.sessao && sessao.sessao.eh_ativa;

  // Função para submeter o formulário
  const handleSubmit = async () => {
    // Validações básicas
    if (!formState.id_categoria) {
      setError('Categoria inválida');
      return;
    }
    setLoading(true);

    try {
      // Sempre converter a data do input (local) para UTC antes de enviar
      let dataToSend: string;
      if (hasActiveSession) {
        // Se há sessão ativa, usar data/hora atual em UTC
        dataToSend = getCurrentUtcDateTime();
      } else {
        // Se não há sessão ativa, usar a data selecionada convertida para UTC
        const localDate = new Date(formState.data);
        dataToSend = convertToUtc(localDate, timezone);
      }

      const payload = {
        id_categoria: formState.id_categoria,
        valor: Number(Math.round(parseFloat(formState.valor) * 100)), // Garantir que seja number
        tipo: selectedCategoria?.tipo || '', // Tipo vem da categoria selecionada
        eventos: Math.max(1, Number(parseInt(formState.eventos || '1', 10) || 1)),
        descricao: formState.descricao || undefined, // Usar undefined em vez de null para Option<String>
        data: dataToSend, // Sempre UTC
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
      const msg = extractErrorMessage(error) ?? 'Erro ao salvar transação. Tente novamente.';
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  // Função para limpar o formulário
  const handleClose = () => {
    reset();
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
            onChange={(e) => setField('valor', e.target.value)}
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
            onChange={(e) => setField('descricao', e.target.value)}
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
              onChange={(e) => setField('id_categoria', e.target.value as string)}
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
            onChange={(e) => setField('data', e.target.value)}
            slotProps={{
              inputLabel: {
                shrink: true,
              },
              input: {
                sx: { borderRadius: 2 },
              },
            }}
          />

          {/* Campo Eventos */}
          <TextField
            label="Eventos (n)"
            type="number"
            fullWidth
            variant="outlined"
            value={formState.eventos}
            onChange={(e) => setField('eventos', e.target.value)}
            inputProps={{ min: 1 }}
            helperText="Quantos eventos esse lançamento representa (>=1)"
            slotProps={{
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
