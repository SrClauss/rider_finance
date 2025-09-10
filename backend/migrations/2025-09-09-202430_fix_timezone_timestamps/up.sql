-- Migração para converter timestamps existentes de America/Sao_Paulo (-03) para UTC
-- Esta migração assume que os dados existentes foram inseridos no fuso horário America/Sao_Paulo
-- e os converte para UTC (adicionando 3 horas)

-- Configurar o timezone do banco de dados para UTC
ALTER DATABASE "ride" SET timezone TO 'UTC';

-- Converter transacoes
UPDATE transacoes 
SET 
    data = data AT TIME ZONE 'America/Sao_Paulo' AT TIME ZONE 'UTC',
    criado_em = criado_em AT TIME ZONE 'America/Sao_Paulo' AT TIME ZONE 'UTC',
    atualizado_em = atualizado_em AT TIME ZONE 'America/Sao_Paulo' AT TIME ZONE 'UTC'
WHERE data AT TIME ZONE 'UTC' != data AT TIME ZONE 'America/Sao_Paulo' AT TIME ZONE 'UTC';

-- Converter usuarios
UPDATE usuarios 
SET 
    criado_em = criado_em AT TIME ZONE 'America/Sao_Paulo' AT TIME ZONE 'UTC',
    atualizado_em = atualizado_em AT TIME ZONE 'America/Sao_Paulo' AT TIME ZONE 'UTC',
    ultima_tentativa_redefinicao = ultima_tentativa_redefinicao AT TIME ZONE 'America/Sao_Paulo' AT TIME ZONE 'UTC',
    blocked_date = CASE 
        WHEN blocked_date IS NOT NULL THEN blocked_date AT TIME ZONE 'America/Sao_Paulo' AT TIME ZONE 'UTC'
        ELSE NULL
    END
WHERE criado_em AT TIME ZONE 'UTC' != criado_em AT TIME ZONE 'America/Sao_Paulo' AT TIME ZONE 'UTC';

-- Converter categorias
UPDATE categorias 
SET 
    criado_em = criado_em AT TIME ZONE 'America/Sao_Paulo' AT TIME ZONE 'UTC',
    atualizado_em = atualizado_em AT TIME ZONE 'America/Sao_Paulo' AT TIME ZONE 'UTC'
WHERE criado_em AT TIME ZONE 'UTC' != criado_em AT TIME ZONE 'America/Sao_Paulo' AT TIME ZONE 'UTC';

-- Converter assinaturas
UPDATE assinaturas 
SET 
    periodo_inicio = periodo_inicio AT TIME ZONE 'America/Sao_Paulo' AT TIME ZONE 'UTC',
    periodo_fim = periodo_fim AT TIME ZONE 'America/Sao_Paulo' AT TIME ZONE 'UTC',
    criado_em = criado_em AT TIME ZONE 'America/Sao_Paulo' AT TIME ZONE 'UTC',
    atualizado_em = atualizado_em AT TIME ZONE 'America/Sao_Paulo' AT TIME ZONE 'UTC'
WHERE criado_em AT TIME ZONE 'UTC' != criado_em AT TIME ZONE 'America/Sao_Paulo' AT TIME ZONE 'UTC';

-- Converter sessoes_trabalho
UPDATE sessoes_trabalho 
SET 
    inicio = inicio AT TIME ZONE 'America/Sao_Paulo' AT TIME ZONE 'UTC',
    fim = CASE 
        WHEN fim IS NOT NULL THEN fim AT TIME ZONE 'America/Sao_Paulo' AT TIME ZONE 'UTC'
        ELSE NULL
    END,
    criado_em = criado_em AT TIME ZONE 'America/Sao_Paulo' AT TIME ZONE 'UTC',
    atualizado_em = atualizado_em AT TIME ZONE 'America/Sao_Paulo' AT TIME ZONE 'UTC'
WHERE criado_em AT TIME ZONE 'UTC' != criado_em AT TIME ZONE 'America/Sao_Paulo' AT TIME ZONE 'UTC';

-- Converter configuracoes
UPDATE configuracoes 
SET 
    criado_em = criado_em AT TIME ZONE 'America/Sao_Paulo' AT TIME ZONE 'UTC',
    atualizado_em = atualizado_em AT TIME ZONE 'America/Sao_Paulo' AT TIME ZONE 'UTC'
WHERE criado_em AT TIME ZONE 'UTC' != criado_em AT TIME ZONE 'America/Sao_Paulo' AT TIME ZONE 'UTC';

-- Converter admins (se existir)
UPDATE admins 
SET 
    criado_em = criado_em AT TIME ZONE 'America/Sao_Paulo' AT TIME ZONE 'UTC',
    atualizado_em = atualizado_em AT TIME ZONE 'America/Sao_Paulo' AT TIME ZONE 'UTC'
WHERE criado_em AT TIME ZONE 'UTC' != criado_em AT TIME ZONE 'America/Sao_Paulo' AT TIME ZONE 'UTC';
