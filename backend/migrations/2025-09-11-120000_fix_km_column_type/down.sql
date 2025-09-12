-- Reverter: converter coluna km de volta para numeric(10,2) NOT NULL DEFAULT 0

ALTER TABLE transacoes ALTER COLUMN km TYPE numeric(10,2) USING km::numeric(10,2);
ALTER TABLE transacoes ALTER COLUMN km SET NOT NULL;
ALTER TABLE transacoes ALTER COLUMN km SET DEFAULT 0;

DROP INDEX IF EXISTS idx_transacoes_km;
