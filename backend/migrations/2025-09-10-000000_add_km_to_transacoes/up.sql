-- Migração: adicionar coluna km com default 0
ALTER TABLE transacoes
ADD COLUMN IF NOT EXISTS km numeric(10,2) NOT NULL DEFAULT 0;

-- Índice para consultas por km (opcional)
CREATE INDEX IF NOT EXISTS idx_transacoes_km ON transacoes (km);
