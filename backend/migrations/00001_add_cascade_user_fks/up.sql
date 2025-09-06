-- Altera chaves estrangeiras relacionadas a usuarios para ON DELETE CASCADE

-- assinaturas
ALTER TABLE assinaturas DROP CONSTRAINT IF EXISTS fk_assinaturas_usuarios;
ALTER TABLE assinaturas ADD CONSTRAINT fk_assinaturas_usuarios FOREIGN KEY (id_usuario) REFERENCES usuarios (id) ON DELETE CASCADE;

-- categorias
ALTER TABLE categorias DROP CONSTRAINT IF EXISTS fk_categorias_usuarios;
ALTER TABLE categorias ADD CONSTRAINT fk_categorias_usuarios FOREIGN KEY (id_usuario) REFERENCES usuarios (id) ON DELETE CASCADE;

-- configuracoes
ALTER TABLE configuracoes DROP CONSTRAINT IF EXISTS fk_configuracoes_usuarios;
ALTER TABLE configuracoes ADD CONSTRAINT fk_configuracoes_usuarios FOREIGN KEY (id_usuario) REFERENCES usuarios (id) ON DELETE CASCADE;

-- metas
ALTER TABLE metas DROP CONSTRAINT IF EXISTS fk_metas_usuarios;
ALTER TABLE metas ADD CONSTRAINT fk_metas_usuarios FOREIGN KEY (id_usuario) REFERENCES usuarios (id) ON DELETE CASCADE;

-- sessoes_trabalho
ALTER TABLE sessoes_trabalho DROP CONSTRAINT IF EXISTS fk_sessoes_trabalho_usuarios;
ALTER TABLE sessoes_trabalho ADD CONSTRAINT fk_sessoes_trabalho_usuarios FOREIGN KEY (id_usuario) REFERENCES usuarios (id) ON DELETE CASCADE;

-- transacoes -> usuarios
ALTER TABLE transacoes DROP CONSTRAINT IF EXISTS fk_transacoes_usuarios;
ALTER TABLE transacoes ADD CONSTRAINT fk_transacoes_usuarios FOREIGN KEY (id_usuario) REFERENCES usuarios (id) ON DELETE CASCADE;

-- transacoes -> categorias (para cascatar exclusão quando categoria for removida)
ALTER TABLE transacoes DROP CONSTRAINT IF EXISTS fk_transacoes_categorias;
ALTER TABLE transacoes ADD CONSTRAINT fk_transacoes_categorias FOREIGN KEY (id_categoria) REFERENCES categorias (id) ON DELETE CASCADE;
