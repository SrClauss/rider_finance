"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { Box, Button, Card, CardContent, MenuItem, TextField, Typography, Stack } from "@mui/material";
import LoggedLayout from "@/layouts/LoggedLayout";
import { RelatorioTransacoesRequest, TransacaoFiltro } from "@/interfaces/RelatorioTransacoesRequest";
import { useCategoriaContext, carregarCategorias } from "@/context/CategoriaContext";

const tiposArquivo = [
  { value: "pdf", label: "PDF" },
  { value: "xlsx", label: "Excel (XLSX)" },
];

export default function RelatoriosPage() {
  const [filtros, setFiltros] = useState<TransacaoFiltro>({});
  const [tipoArquivo, setTipoArquivo] = useState<'pdf' | 'xlsx'>('pdf');
  const [loading, setLoading] = useState(false);
  const { categorias, setCategorias } = useCategoriaContext();

  useEffect(() => {
    if (categorias.length === 0) {
      carregarCategorias().then(setCategorias);
    }
  }, [categorias.length, setCategorias]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const handleDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value ? new Date(e.target.value).toISOString() : null });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const req: RelatorioTransacoesRequest = {
      tipo_arquivo: tipoArquivo,
      filtros: {
        ...filtros,
        id_categoria: filtros.id_categoria || null,
        descricao: filtros.descricao || null,
        tipo: filtros.tipo || null,
        data_inicio: filtros.data_inicio || null,
        data_fim: filtros.data_fim || null,
      },
    };
    try {
      // Use rota relativa para que as requisições passem pelo proxy (nginx)
      // em produção/compose, ou pelo host quando acessado localmente.
      const res = await axios.post("/api/relatorio/transacoes", req, { withCredentials: true, responseType: 'blob' });
      const blob = res.data as Blob;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = tipoArquivo === "pdf" ? "relatorio.pdf" : "relatorio.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Erro ao gerar relatório");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoggedLayout>
      <Box sx={{ maxWidth: 500, mx: "auto", mt: 6 }}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>Gerar Relatório de Transações</Typography>
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  select
                  label="Categoria"
                  name="id_categoria"
                  value={filtros.id_categoria || ""}
                  onChange={handleChange}
                  fullWidth
                >
                  <MenuItem value="">Todas</MenuItem>
                  {categorias.map(cat => (
                    <MenuItem key={cat.id} value={cat.id}>{cat.nome}</MenuItem>
                  ))}
                </TextField>
                <TextField label="Descrição" name="descricao" value={filtros.descricao || ""} onChange={handleChange} fullWidth />
                <TextField
                  select
                  label="Tipo"
                  name="tipo"
                  value={filtros.tipo || ""}
                  onChange={handleChange}
                  fullWidth
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="entrada">Receita</MenuItem>
                  <MenuItem value="saida">Despesa</MenuItem>
                </TextField>
                <TextField label="Data Início" name="data_inicio" type="date" InputLabelProps={{ shrink: true }} onChange={handleDataChange} fullWidth />
                <TextField label="Data Fim" name="data_fim" type="date" InputLabelProps={{ shrink: true }} onChange={handleDataChange} fullWidth />
                <TextField select label="Tipo de Arquivo" value={tipoArquivo} onChange={e => setTipoArquivo(e.target.value as 'pdf' | 'xlsx')} fullWidth>
                  {tiposArquivo.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                </TextField>
                <Button type="submit" variant="contained" color="primary" disabled={loading}>
                  {loading ? "Gerando..." : "Gerar Relatório"}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </LoggedLayout>
  );
}
