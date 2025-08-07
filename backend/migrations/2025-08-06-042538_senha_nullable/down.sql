UPDATE usuarios SET senha = '' WHERE senha IS NULL;
ALTER TABLE usuarios ALTER COLUMN senha SET NOT NULL;
-- This file should undo anything in `up.sql`
