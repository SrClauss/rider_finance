"use client";


import { useEffect, useState } from "react";
import useFormReducer from "@/lib/useFormReducer";
import { Box, Typography, Button, CircularProgress, Alert, Pagination, TextField, MenuItem, Drawer, IconButton, Stack } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import AddIcon from "@mui/icons-material/Add";
import LoggedLayout from "@/layouts/LoggedLayout";
import TransactionList from "@/components/transactions/TransactionList";
import TransactionModal from "@/modals/TransactionModal";
import CategoriaModal from "@/modals/CategoriaModal";

import ConfirmDeleteModal from "@/modals/ConfirmDeleteModal";
import type { Transaction } from "@/interfaces/Transaction";
import axios from "axios";
import dayjs from "dayjs";
import { CategoriaProvider, useCategoriaContext, carregarCategorias } from "@/context/CategoriaContext";
import { useMetasContext } from "@/context/MetasContext";
import { AcaoTransacao } from "@/utils/atualizarTransacoesContexto";


export default function TransactionsPage() {
  return (
    <CategoriaProvider>
      <LoggedLayout>
        <TransactionsPageInner />
      </LoggedLayout>
    </CategoriaProvider>
  );
}

  function TransactionsPageInner() {
  const { dispatchTransacao } = useMetasContext(); // Apenas para atualizar metas
    // Controle de deleção
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);
    // Controle de edição
    const [editTx, setEditTx] = useState<Transaction | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]); // Fonte de verdade para renderização
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [categoriaModalOpen, setCategoriaModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [total, setTotal] = useState(0);
    // Filtros
    const { state: filtros, setField: setFiltro, setState: setFiltros, reset: resetFiltros } = useFormReducer({
      idCategoria: "",
      descricao: "",
      tipo: "",
      dataInicio: "",
      dataFim: "",
    });

    const limparFiltros = () => {
      resetFiltros();
    };

    const { categorias, setCategorias } = useCategoriaContext();
    // Função chamada ao clicar em deletar
    const handleDeleteClick = (id: string) => {
      setSelectedDeleteId(id);
      setDeleteModalOpen(true);
    };

    // Confirma a deleção
    const handleConfirmDelete = async () => {
      if (!selectedDeleteId) return;
      setLoading(true);
      setError(null);
      try {
        await axios.delete(`/api/transacao/${selectedDeleteId}`);
        setDeleteModalOpen(false);
        setSelectedDeleteId(null);
        await fetchTransacoes();
        // Atualiza contexto global após exclusão
        dispatchTransacao({ id: selectedDeleteId } as any, 'delete');
      } catch (e: any) {
        setError(e?.response?.data?.message || "Erro ao deletar transação");
      } finally {
        setLoading(false);
      }
    };

    // Função chamada ao clicar em editar
    const handleEditClick = (tx: Transaction) => {
      setEditTx(tx);
      setModalOpen(true);
    };

    // Ao fechar modal de transação, limpa edição
    const handleCloseTransactionModal = () => {
      setModalOpen(false);
      setEditTx(null);
    };

    // Ao salvar edição
    const handleTransactionEdited = async () => {
      setModalOpen(false);
      setEditTx(null);
      await fetchTransacoes();
    };
    // Atualiza categorias após criar nova categoria
    const handleCategoriaCreated = async () => {
      setCategoriaModalOpen(false);
      const novas = await carregarCategorias();
      setCategorias(novas);
    };
    // Carrega categorias ao entrar na página, se ainda não estiverem carregadas
    useEffect(() => {
      if (!categorias || categorias.length === 0) {
        carregarCategorias().then(setCategorias).catch(() => {});
      }
    }, []);

    const fetchTransacoes = async (overridePage?: number) => {
      setLoading(true);
      setError(null);
      const filtros: any = {
        page: overridePage ?? page,
        page_size: pageSize,
      };
  if (filtros.idCategoria) filtros.id_categoria = filtros.idCategoria;
  if (filtros.descricao) filtros.descricao = filtros.descricao;
  if (filtros.tipo) filtros.tipo = filtros.tipo;
  if (filtros.dataInicio) filtros.data_inicio = dayjs(filtros.dataInicio).format("YYYY-MM-DDTHH:mm:ss");
  if (filtros.dataFim) filtros.data_fim = dayjs(filtros.dataFim).format("YYYY-MM-DDTHH:mm:ss");
      try {
        const res = await axios.post("/api/transacoes", filtros, { withCredentials: true });
        setTransactions(Array.isArray(res.data?.items) ? res.data.items : []);
        setTotal(typeof res.data?.total === 'number' ? res.data.total : 0);
      } catch {
        setError("Erro ao buscar transações");
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchTransacoes();
  }, [page, pageSize, filtros.idCategoria, filtros.descricao, filtros.tipo, filtros.dataInicio, filtros.dataFim]);

    const handleAdd = () => setModalOpen(true);
    const handleCloseModal = () => setModalOpen(false);
    const handleTransactionCreated = async () => {
      setModalOpen(false);
      setEditTx(null);
      setPage(1);
      await fetchTransacoes(1);
    };

    return (
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
              value={filtros.idCategoria}
              onChange={e => setFiltro('idCategoria', e.target.value)}
              size="small"
              select
              sx={{ mb: 2 }}
            >
              <MenuItem value="">Todas</MenuItem>
              {categorias.map(cat => (
                <MenuItem key={cat.id} value={cat.id}>{cat.nome}</MenuItem>
              ))}
            </TextField>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setCategoriaModalOpen(true)}
              sx={{ mb: 2 }}
              startIcon={<AddIcon />}
            >
              Nova Categoria
            </Button>
            <TextField
              label="Descrição"
              value={filtros.descricao}
              onChange={e => setFiltro('descricao', e.target.value)}
              size="small"
              sx={{ mb: 2 }}
            />
            <TextField
              label="Tipo"
              value={filtros.tipo}
              onChange={e => setFiltro('tipo', e.target.value)}
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
              value={filtros.dataInicio}
              onChange={e => setFiltro('dataInicio', e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Data fim"
              type="date"
              value={filtros.dataFim}
              onChange={e => setFiltro('dataFim', e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
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
            <TransactionList
              transactions={transactions}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
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
        <TransactionModal
          open={modalOpen}
          onClose={handleCloseTransactionModal}
          onCreated={handleTransactionCreated}
          onEdited={handleTransactionEdited}
          transaction={editTx}
        />
        <ConfirmDeleteModal
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Confirmar exclusão"
          description="Tem certeza que deseja deletar esta transação? Esta ação não pode ser desfeita."
        />
        <CategoriaModal open={categoriaModalOpen} onClose={() => setCategoriaModalOpen(false)} onCreated={handleCategoriaCreated} />
      </Box>
    );
  }
  
