-- Reverte as constraints únicas adicionadas em up.sql

ALTER TABLE usuarios
  DROP CONSTRAINT IF EXISTS usuarios_cpfcnpj_unique;

ALTER TABLE usuarios
  DROP CONSTRAINT IF EXISTS usuarios_nome_usuario_unique;

ALTER TABLE admins
  DROP CONSTRAINT IF EXISTS admins_username_unique;
