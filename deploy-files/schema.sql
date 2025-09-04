-- Arquivo SQL gerado automaticamente a partir do schema.rs

CREATE TABLE assinaturas (
    id VARCHAR PRIMARY KEY,
    id_usuario VARCHAR NOT NULL,
    asaas_subscription_id VARCHAR NOT NULL,
    periodo_inicio TIMESTAMP NOT NULL,
    periodo_fim TIMESTAMP NOT NULL,
    criado_em TIMESTAMP NOT NULL,
    atualizado_em TIMESTAMP NOT NULL
);

CREATE TABLE categorias (
    id VARCHAR PRIMARY KEY,
    id_usuario VARCHAR,
    nome VARCHAR NOT NULL,
    tipo VARCHAR NOT NULL,
    icone VARCHAR,
    cor VARCHAR,
    criado_em TIMESTAMP NOT NULL,
    atualizado_em TIMESTAMP NOT NULL
);

CREATE TABLE configuracoes (
    id VARCHAR PRIMARY KEY,
    id_usuario VARCHAR,
    chave VARCHAR NOT NULL,
    valor VARCHAR,
    categoria VARCHAR,
    descricao VARCHAR,
    tipo_dado VARCHAR,
    eh_publica BOOLEAN NOT NULL,
    criado_em TIMESTAMP NOT NULL,
    atualizado_em TIMESTAMP NOT NULL
);

CREATE TABLE metas (
    id VARCHAR PRIMARY KEY,
    id_usuario VARCHAR NOT NULL,
    titulo VARCHAR NOT NULL,
    descricao VARCHAR,
    tipo VARCHAR NOT NULL,
    categoria VARCHAR NOT NULL,
    valor_alvo INT NOT NULL,
    valor_atual INT NOT NULL,
    unidade VARCHAR,
    data_inicio TIMESTAMP NOT NULL,
    data_fim TIMESTAMP,
    eh_ativa BOOLEAN NOT NULL,
    eh_concluida BOOLEAN NOT NULL,
    concluida_em TIMESTAMP,
    criado_em TIMESTAMP NOT NULL,
    atualizado_em TIMESTAMP NOT NULL,
    concluida_com INT
);

CREATE TABLE sessoes_trabalho (
    id VARCHAR PRIMARY KEY,
    id_usuario VARCHAR NOT NULL,
    inicio TIMESTAMP NOT NULL,
    fim TIMESTAMP,
    total_minutos INT,
    local_inicio VARCHAR,
    local_fim VARCHAR,
    total_corridas INT NOT NULL,
    total_ganhos INT NOT NULL,
    total_gastos INT NOT NULL,
    plataforma VARCHAR,
    observacoes VARCHAR,
    clima VARCHAR,
    eh_ativa BOOLEAN NOT NULL,
    criado_em TIMESTAMP NOT NULL,
    atualizado_em TIMESTAMP NOT NULL
);

CREATE TABLE transacoes (
    id VARCHAR PRIMARY KEY,
    id_usuario VARCHAR NOT NULL,
    id_categoria VARCHAR NOT NULL,
    valor INT NOT NULL,
    eventos INT NOT NULL DEFAULT 1,
    descricao VARCHAR,
    tipo VARCHAR NOT NULL,
    data TIMESTAMP NOT NULL,
    criado_em TIMESTAMP NOT NULL,
    atualizado_em TIMESTAMP NOT NULL
);

CREATE TABLE usuarios (
    id VARCHAR PRIMARY KEY,
    nome_usuario VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    senha VARCHAR NOT NULL,
    nome_completo VARCHAR NOT NULL,
    telefone VARCHAR NOT NULL,
    veiculo VARCHAR NOT NULL,
    blocked BOOLEAN NOT NULL DEFAULT FALSE,
    blocked_date TIMESTAMP,
    criado_em TIMESTAMP NOT NULL,
    atualizado_em TIMESTAMP NOT NULL,
    ultima_tentativa_redefinicao TIMESTAMP NOT NULL,
    address VARCHAR NOT NULL,
    address_number VARCHAR NOT NULL,
    complement VARCHAR NOT NULL,
    postal_code VARCHAR NOT NULL,
    province VARCHAR NOT NULL,
    city VARCHAR NOT NULL,
    cpfcnpj VARCHAR NOT NULL
);

CREATE TABLE admins (
    id VARCHAR PRIMARY KEY,
    username VARCHAR NOT NULL UNIQUE,
    password_hash VARCHAR NOT NULL,
    criado_em TIMESTAMP NOT NULL,
    atualizado_em TIMESTAMP NOT NULL
);

-- Definições de chaves estrangeiras
ALTER TABLE assinaturas ADD CONSTRAINT fk_assinaturas_usuarios FOREIGN KEY (id_usuario) REFERENCES usuarios (id);
ALTER TABLE categorias ADD CONSTRAINT fk_categorias_usuarios FOREIGN KEY (id_usuario) REFERENCES usuarios (id);
ALTER TABLE configuracoes ADD CONSTRAINT fk_configuracoes_usuarios FOREIGN KEY (id_usuario) REFERENCES usuarios (id);
ALTER TABLE metas ADD CONSTRAINT fk_metas_usuarios FOREIGN KEY (id_usuario) REFERENCES usuarios (id);
ALTER TABLE sessoes_trabalho ADD CONSTRAINT fk_sessoes_trabalho_usuarios FOREIGN KEY (id_usuario) REFERENCES usuarios (id);
ALTER TABLE transacoes ADD CONSTRAINT fk_transacoes_categorias FOREIGN KEY (id_categoria) REFERENCES categorias (id);
ALTER TABLE transacoes ADD CONSTRAINT fk_transacoes_usuarios FOREIGN KEY (id_usuario) REFERENCES usuarios (id);
