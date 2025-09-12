-- Reverter migração: remover coluna km e índice
DROP INDEX IF EXISTS idx_transacoes_km;
ALTER TABLE transacoes DROP COLUMN IF EXISTS km;
