-- Migration: converter coluna km de numeric(10,2) para double precision (float8) e tornar nullable

-- 1) Remover DEFAULT e NOT NULL para permitir alterações seguras
ALTER TABLE transacoes ALTER COLUMN km DROP DEFAULT;
ALTER TABLE transacoes ALTER COLUMN km DROP NOT NULL;

-- 2) Converter o tipo para double precision
ALTER TABLE transacoes ALTER COLUMN km TYPE double precision USING km::double precision;

-- 3) Garantir índice (opcional)
CREATE INDEX IF NOT EXISTS idx_transacoes_km ON transacoes (km);
