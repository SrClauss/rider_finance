"use client";


import { useEffect, useState } from "react";
import { Box, Typography, Button, CircularProgress, Alert, Pagination, TextField, MenuItem, Drawer, IconButton, Stack } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import AddIcon from "@mui/icons-material/Add";
import LoggedLayout from "@/layouts/LoggedLayout";
import TransactionList from "@/components/transactions/TransactionList";
import TransactionModal from "@/components/transactions/TransactionModal";
import type { Transaction } from "@/interfaces/Transaction";
import axios from "axios";
import dayjs from "dayjs";
import { CategoriaProvider, useCategoriaContext, carregarCategorias } from "@/context/CategoriaContext";

export default function TransactionsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  // Filtros
  const [idCategoria, setIdCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const limparFiltros = () => {
    setIdCategoria("");
    setDescricao("");
    setTipo("");
    setDataInicio("");
    setDataFim("");
  };

  const { categorias, setCategorias } = useCategoriaContext();
  // Carrega categorias ao entrar na página, se ainda não estiverem carregadas
  useEffect(() => {
    if (!categorias || categorias.length === 0) {
      carregarCategorias().then(setCategorias).catch(() => {});
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const filtros: any = {
      page,
      page_size: pageSize,
    };
    if (idCategoria) filtros.id_categoria = idCategoria;
    if (descricao) filtros.descricao = descricao;
    if (tipo) filtros.tipo = tipo;
  if (dataInicio) filtros.data_inicio = dayjs(dataInicio).format("YYYY-MM-DDTHH:mm:ss");
  if (dataFim) filtros.data_fim = dayjs(dataFim).format("YYYY-MM-DDTHH:mm:ss");
    axios.post("/api/transacoes", filtros, { withCredentials: true })
      .then((res) => {
        setTransactions(Array.isArray(res.data?.items) ? res.data.items : []);
        setTotal(typeof res.data?.total === 'number' ? res.data.total : 0);
      })
      .catch(() => setError("Erro ao buscar transações"))
      .finally(() => setLoading(false));
  }, [page, pageSize, idCategoria, descricao, tipo, dataInicio, dataFim]);

  const handleAdd = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);
  const handleTransactionCreated = async (newTx: Omit<Transaction, "id" | "id_usuario">) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post<Transaction>("/api/transacao", newTx, { withCredentials: true });
      // Recarrega a página 1 após criar
      setPage(1);
      setModalOpen(false);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Erro ao criar transação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CategoriaProvider>

    <LoggedLayout>


      <Box sx={{ maxWidth: 700, mx: "auto", p: { xs: 2, md: 4 } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h4" fontWeight={700} color="#fff">
              Transações
            </Typography>
            <IconButton color="primary" onClick={() => setDrawerOpen(true)} aria-label="Abrir filtros">
              <FilterListIcon />
            </IconButton>
          </Stack>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Nova
          </Button>
        </Box>

        <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <Box sx={{ width: 320, p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Filtros
            </Typography>
            <TextField
              label="Categoria"
              value={idCategoria}
              onChange={e => setIdCategoria(e.target.value)}
              size="small"
              select
              sx={{ mb: 2 }}
            >
              <MenuItem value="">Todas</MenuItem>
              {categorias.map(cat => (
                <MenuItem key={cat.id} value={cat.id}>{cat.nome}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Descrição"
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              size="small"
              sx={{ mb: 2 }}
            />
            <TextField
              label="Tipo"
              value={tipo}
              onChange={e => setTipo(e.target.value)}
              select
              size="small"
              sx={{ mb: 2 }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="entrada">Receita</MenuItem>
              <MenuItem value="saida">Despesa</MenuItem>
            </TextField>
            <TextField
              label="Data início"
              type="date"
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Data fim"
              type="date"
              value={dataFim}
              onChange={e => setDataFim(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            <Box sx={{ flexGrow: 1 }} />
            <Stack direction="row" spacing={2}>
              <Button variant="contained" color="primary" onClick={() => setDrawerOpen(false)} fullWidth>
                Aplicar Filtros
              </Button>
              <Button variant="outlined" color="secondary" onClick={limparFiltros} fullWidth>
                Limpar
              </Button>
            </Stack>
          </Box>
        </Drawer>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            <Typography variant="subtitle2" color="#bbb" sx={{ mb: 1 }}>
              Exibindo as últimas {(Array.isArray(transactions) ? transactions.length : 0)} transações de um total de {typeof total === 'number' ? total : 0}.
            </Typography>
            <TransactionList transactions={transactions} />
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Pagination
                count={Math.ceil(total / pageSize)}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          </>
        )}
        <TransactionModal open={modalOpen} onClose={handleCloseModal} onCreated={handleTransactionCreated} />
      </Box>
    </LoggedLayout>
    </CategoriaProvider>
  );
}
