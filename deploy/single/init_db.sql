-- init_db.sql
-- Gerado a partir de backend/src/schema.rs
-- Cria as tabelas necessárias para o runtime da aplicação

CREATE TABLE IF NOT EXISTS usuarios (
  id varchar PRIMARY KEY,
  nome_usuario varchar NOT NULL,
  email varchar NOT NULL,
  senha varchar NOT NULL,
  nome_completo varchar NOT NULL,
  telefone varchar NOT NULL,
  veiculo varchar NOT NULL,
  criado_em timestamp NOT NULL,
  atualizado_em timestamp NOT NULL,
  ultima_tentativa_redefinicao timestamp NOT NULL,
  address varchar NOT NULL,
  address_number varchar NOT NULL,
  complement varchar NOT NULL,
  postal_code varchar NOT NULL,
  province varchar NOT NULL,
  city varchar NOT NULL,
  cpfcnpj varchar NOT NULL
);

CREATE TABLE IF NOT EXISTS categorias (
  id varchar PRIMARY KEY,
  id_usuario varchar NULL,
  nome varchar NOT NULL,
  tipo varchar NOT NULL,
  icone varchar NULL,
  cor varchar NULL,
  criado_em timestamp NOT NULL,
  atualizado_em timestamp NOT NULL,
  CONSTRAINT fk_categorias_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS configuracoes (
  id varchar PRIMARY KEY,
  id_usuario varchar NULL,
  chave varchar NOT NULL,
  valor varchar NULL,
  categoria varchar NULL,
  descricao varchar NULL,
  tipo_dado varchar NULL,
  eh_publica boolean NOT NULL,
  criado_em timestamp NOT NULL,
  atualizado_em timestamp NOT NULL,
  CONSTRAINT fk_configuracoes_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS assinaturas (
  id varchar PRIMARY KEY,
  id_usuario varchar NOT NULL,
  asaas_subscription_id varchar NOT NULL,
  periodo_inicio timestamp NOT NULL,
  periodo_fim timestamp NOT NULL,
  criado_em timestamp NOT NULL,
  atualizado_em timestamp NOT NULL,
  CONSTRAINT fk_assinaturas_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS metas (
  id varchar PRIMARY KEY,
  id_usuario varchar NOT NULL,
  titulo varchar NOT NULL,
  descricao varchar NULL,
  tipo varchar NOT NULL,
  categoria varchar NOT NULL,
  valor_alvo integer NOT NULL,
  valor_atual integer NOT NULL,
  unidade varchar NULL,
  data_inicio timestamp NOT NULL,
  data_fim timestamp NULL,
  eh_ativa boolean NOT NULL,
  eh_concluida boolean NOT NULL,
  concluida_em timestamp NULL,
  criado_em timestamp NOT NULL,
  atualizado_em timestamp NOT NULL,
  concluida_com integer NULL,
  CONSTRAINT fk_metas_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessoes_trabalho (
  id varchar PRIMARY KEY,
  id_usuario varchar NOT NULL,
  inicio timestamp NOT NULL,
  fim timestamp NULL,
  total_minutos integer NULL,
  local_inicio varchar NULL,
  local_fim varchar NULL,
  total_corridas integer NOT NULL,
  total_ganhos integer NOT NULL,
  total_gastos integer NOT NULL,
  plataforma varchar NULL,
  observacoes varchar NULL,
  clima varchar NULL,
  eh_ativa boolean NOT NULL,
  criado_em timestamp NOT NULL,
  atualizado_em timestamp NOT NULL,
  CONSTRAINT fk_sessoes_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transacoes (
  id varchar PRIMARY KEY,
  id_usuario varchar NOT NULL,
  id_categoria varchar NOT NULL,
  valor integer NOT NULL,
  descricao varchar NULL,
  tipo varchar NOT NULL,
  data timestamp NOT NULL,
  criado_em timestamp NOT NULL,
  atualizado_em timestamp NOT NULL,
  CONSTRAINT fk_transacoes_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_transacoes_categoria FOREIGN KEY (id_categoria) REFERENCES categorias(id) ON DELETE RESTRICT
);

-- Optionally: create minimal indexes commonly used
CREATE INDEX IF NOT EXISTS idx_transacoes_id_usuario ON transacoes(id_usuario);
CREATE INDEX IF NOT EXISTS idx_categorias_id_usuario ON categorias(id_usuario);
CREATE INDEX IF NOT EXISTS idx_metas_id_usuario ON metas(id_usuario);

-- End of init_db.sql
