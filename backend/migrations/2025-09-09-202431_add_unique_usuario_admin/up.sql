-- Migração: tornar únicos os campos cpfcnpj e nome_usuario em usuarios, e username em admins
-- Observação: esta migração foi tornada idempotente — só cria constraints se não existirem

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_cpfcnpj_unique') THEN
    ALTER TABLE usuarios ADD CONSTRAINT usuarios_cpfcnpj_unique UNIQUE (cpfcnpj);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_nome_usuario_unique') THEN
    ALTER TABLE usuarios ADD CONSTRAINT usuarios_nome_usuario_unique UNIQUE (nome_usuario);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admins_username_unique') THEN
    ALTER TABLE admins ADD CONSTRAINT admins_username_unique UNIQUE (username);
  END IF;
END
$$;
