-- Migration: Remover colunas eh_ativa e eh_padrao de categorias
ALTER TABLE categorias DROP COLUMN IF EXISTS eh_padrao;
ALTER TABLE categorias DROP COLUMN IF EXISTS eh_ativa;
