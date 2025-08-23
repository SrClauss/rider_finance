-- Reverter: adicionar colunas eh_ativa e eh_padrao em categorias com valores default
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS eh_padrao boolean NOT NULL DEFAULT false;
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS eh_ativa boolean NOT NULL DEFAULT true;
