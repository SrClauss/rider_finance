
CREATE TABLE usuarios (
    id TEXT PRIMARY KEY,
    nome_usuario VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    senha VARCHAR NOT NULL,
    nome_completo VARCHAR,
    telefone VARCHAR,
    veiculo VARCHAR,
    data_inicio_atividade DATE,
    eh_pago BOOLEAN NOT NULL,
    id_pagamento VARCHAR,
    metodo_pagamento VARCHAR,
    status_pagamento VARCHAR NOT NULL,
    tipo_assinatura VARCHAR NOT NULL,
    trial_termina_em TIMESTAMP,
    criado_em TIMESTAMP NOT NULL,
    atualizado_em TIMESTAMP NOT NULL
);

CREATE TABLE assinaturas (
    id TEXT PRIMARY KEY,
    id_usuario TEXT NOT NULL REFERENCES usuarios(id),
    tipo_plano VARCHAR NOT NULL,
    status VARCHAR NOT NULL,
    asaas_customer_id VARCHAR NOT NULL,
    asaas_subscription_id VARCHAR,
    periodo_inicio TIMESTAMP NOT NULL,
    periodo_fim TIMESTAMP NOT NULL,
    cancelada_em TIMESTAMP,
    criado_em TIMESTAMP NOT NULL,
    atualizado_em TIMESTAMP NOT NULL
);

CREATE TABLE categorias (
    id TEXT PRIMARY KEY,
    id_usuario TEXT REFERENCES usuarios(id),
    nome VARCHAR NOT NULL,
    tipo VARCHAR NOT NULL,
    icone VARCHAR,
    cor VARCHAR,
    eh_padrao BOOLEAN NOT NULL,
    eh_ativa BOOLEAN NOT NULL,
    criado_em TIMESTAMP NOT NULL,
    atualizado_em TIMESTAMP NOT NULL
);

CREATE TABLE configuracoes (
    id TEXT PRIMARY KEY,
    id_usuario TEXT NOT NULL REFERENCES usuarios(id),
    chave VARCHAR NOT NULL,
    valor TEXT,
    categoria VARCHAR,
    descricao VARCHAR,
    tipo_dado VARCHAR,
    eh_publica BOOLEAN NOT NULL,
    criado_em TIMESTAMP NOT NULL,
    atualizado_em TIMESTAMP NOT NULL
);

CREATE TABLE metas (
    id TEXT PRIMARY KEY,
    id_usuario TEXT NOT NULL REFERENCES usuarios(id),
    titulo VARCHAR NOT NULL,
    descricao TEXT,
    tipo VARCHAR NOT NULL,
    categoria VARCHAR NOT NULL,
    valor_alvo INTEGER NOT NULL,
    valor_atual INTEGER NOT NULL,
    unidade VARCHAR,
    data_inicio TIMESTAMP NOT NULL,
    data_fim TIMESTAMP,
    eh_ativa BOOLEAN NOT NULL,
    eh_concluida BOOLEAN NOT NULL,
    concluida_em TIMESTAMP,
    lembrete_ativo BOOLEAN NOT NULL,
    frequencia_lembrete VARCHAR,
    criado_em TIMESTAMP NOT NULL,
    atualizado_em TIMESTAMP NOT NULL
);

CREATE TABLE sessoes_trabalho (
    id TEXT PRIMARY KEY,
    id_usuario TEXT NOT NULL REFERENCES usuarios(id),
    inicio TIMESTAMP NOT NULL,
    fim TIMESTAMP,
    total_minutos INTEGER,
    local_inicio VARCHAR,
    local_fim VARCHAR,
    total_corridas INTEGER NOT NULL,
    total_ganhos INTEGER NOT NULL,
    total_gastos INTEGER NOT NULL,
    plataforma VARCHAR,
    observacoes TEXT,
    clima VARCHAR,
    eh_ativa BOOLEAN NOT NULL,
    criado_em TIMESTAMP NOT NULL,
    atualizado_em TIMESTAMP NOT NULL
);

CREATE TABLE transacoes (
    id TEXT PRIMARY KEY,
    id_usuario TEXT NOT NULL REFERENCES usuarios(id),
    id_categoria TEXT NOT NULL REFERENCES categorias(id),
    valor INTEGER NOT NULL,
    descricao TEXT,
    tipo VARCHAR NOT NULL,
    data TIMESTAMP NOT NULL,
    origem VARCHAR,
    id_externo VARCHAR,
    plataforma VARCHAR,
    observacoes TEXT,
    tags VARCHAR,
    criado_em TIMESTAMP NOT NULL,
    atualizado_em TIMESTAMP NOT NULL
);
-- Your SQL goes here
