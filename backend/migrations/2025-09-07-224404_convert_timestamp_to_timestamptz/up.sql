-- Converte todos os campos TIMESTAMP para TIMESTAMPTZ usando 'America/Sao_Paulo' como timezone padrão

-- Tabela assinaturas
ALTER TABLE assinaturas ALTER COLUMN periodo_inicio TYPE TIMESTAMPTZ USING periodo_inicio AT TIME ZONE 'America/Sao_Paulo';
ALTER TABLE assinaturas ALTER COLUMN periodo_fim TYPE TIMESTAMPTZ USING periodo_fim AT TIME ZONE 'America/Sao_Paulo';
ALTER TABLE assinaturas ALTER COLUMN criado_em TYPE TIMESTAMPTZ USING criado_em AT TIME ZONE 'America/Sao_Paulo';
ALTER TABLE assinaturas ALTER COLUMN atualizado_em TYPE TIMESTAMPTZ USING atualizado_em AT TIME ZONE 'America/Sao_Paulo';

-- Tabela categorias
ALTER TABLE categorias ALTER COLUMN criado_em TYPE TIMESTAMPTZ USING criado_em AT TIME ZONE 'America/Sao_Paulo';
ALTER TABLE categorias ALTER COLUMN atualizado_em TYPE TIMESTAMPTZ USING atualizado_em AT TIME ZONE 'America/Sao_Paulo';

-- Tabela configuracoes
ALTER TABLE configuracoes ALTER COLUMN criado_em TYPE TIMESTAMPTZ USING criado_em AT TIME ZONE 'America/Sao_Paulo';
ALTER TABLE configuracoes ALTER COLUMN atualizado_em TYPE TIMESTAMPTZ USING atualizado_em AT TIME ZONE 'America/Sao_Paulo';

-- Tabela metas
ALTER TABLE metas ALTER COLUMN data_inicio TYPE TIMESTAMPTZ USING data_inicio AT TIME ZONE 'America/Sao_Paulo';
ALTER TABLE metas ALTER COLUMN data_fim TYPE TIMESTAMPTZ USING data_fim AT TIME ZONE 'America/Sao_Paulo';
ALTER TABLE metas ALTER COLUMN concluida_em TYPE TIMESTAMPTZ USING concluida_em AT TIME ZONE 'America/Sao_Paulo';
ALTER TABLE metas ALTER COLUMN criado_em TYPE TIMESTAMPTZ USING criado_em AT TIME ZONE 'America/Sao_Paulo';
ALTER TABLE metas ALTER COLUMN atualizado_em TYPE TIMESTAMPTZ USING atualizado_em AT TIME ZONE 'America/Sao_Paulo';

-- Tabela sessoes_trabalho
ALTER TABLE sessoes_trabalho ALTER COLUMN inicio TYPE TIMESTAMPTZ USING inicio AT TIME ZONE 'America/Sao_Paulo';
ALTER TABLE sessoes_trabalho ALTER COLUMN fim TYPE TIMESTAMPTZ USING fim AT TIME ZONE 'America/Sao_Paulo';
ALTER TABLE sessoes_trabalho ALTER COLUMN criado_em TYPE TIMESTAMPTZ USING criado_em AT TIME ZONE 'America/Sao_Paulo';
ALTER TABLE sessoes_trabalho ALTER COLUMN atualizado_em TYPE TIMESTAMPTZ USING atualizado_em AT TIME ZONE 'America/Sao_Paulo';

-- Tabela transacoes
ALTER TABLE transacoes ALTER COLUMN data TYPE TIMESTAMPTZ USING data AT TIME ZONE 'America/Sao_Paulo';
ALTER TABLE transacoes ALTER COLUMN criado_em TYPE TIMESTAMPTZ USING criado_em AT TIME ZONE 'America/Sao_Paulo';
ALTER TABLE transacoes ALTER COLUMN atualizado_em TYPE TIMESTAMPTZ USING atualizado_em AT TIME ZONE 'America/Sao_Paulo';

-- Tabela usuarios
ALTER TABLE usuarios ALTER COLUMN blocked_date TYPE TIMESTAMPTZ USING blocked_date AT TIME ZONE 'America/Sao_Paulo';
ALTER TABLE usuarios ALTER COLUMN criado_em TYPE TIMESTAMPTZ USING criado_em AT TIME ZONE 'America/Sao_Paulo';
ALTER TABLE usuarios ALTER COLUMN atualizado_em TYPE TIMESTAMPTZ USING atualizado_em AT TIME ZONE 'America/Sao_Paulo';
ALTER TABLE usuarios ALTER COLUMN ultima_tentativa_redefinicao TYPE TIMESTAMPTZ USING ultima_tentativa_redefinicao AT TIME ZONE 'America/Sao_Paulo';

-- Tabela admins
ALTER TABLE admins ALTER COLUMN criado_em TYPE TIMESTAMPTZ USING criado_em AT TIME ZONE 'America/Sao_Paulo';
ALTER TABLE admins ALTER COLUMN atualizado_em TYPE TIMESTAMPTZ USING atualizado_em AT TIME ZONE 'America/Sao_Paulo';
