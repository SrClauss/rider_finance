-- Migração: tornar únicos os campos cpfcnpj e nome_usuario em usuarios, e username em admins
-- Observação: esta migração falhará se já existirem valores duplicados nas colunas alvo.

ALTER TABLE usuarios
  ADD CONSTRAINT usuarios_cpfcnpj_unique UNIQUE (cpfcnpj);

ALTER TABLE usuarios
  ADD CONSTRAINT usuarios_nome_usuario_unique UNIQUE (nome_usuario);

ALTER TABLE admins
  ADD CONSTRAINT admins_username_unique UNIQUE (username);
