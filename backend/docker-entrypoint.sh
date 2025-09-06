#!/usr/bin/env bash
set -euo pipefail

# Fallback DATABASE_URL padrão
: ${DATABASE_URL:="postgres://postgres:dy213y1984@postgres:5432/ride"}

echo "Waiting for postgres..."
until pg_isready -d "${DATABASE_URL}" -U "postgres" >/dev/null 2>&1; do
  sleep 1
done

# Função auxiliar para executar psql com a DATABASE_URL completa
psql_url_exec() {
  # $1 = connection string
  # rest are args passed to psql
  psql "$1" "${@:2}"
}

DB_NAME="${DATABASE_URL##*/}"

# Verifica se o banco da DATABASE_URL existe conectando-se a ele
if psql "${DATABASE_URL}" -c '\q' >/dev/null 2>&1; then
  echo "Target database reachable"
  # Checar se uma tabela chave existe (ex: usuarios). Se nao existir, importar schema.sql se disponível.
  if psql "${DATABASE_URL}" -tAc "SELECT to_regclass('public.usuarios')" | grep -q "^$"; then
    echo "Table 'usuarios' not found in ${DB_NAME}. Will attempt to import /deploy-files/schema.sql if present."
    if [ -f /deploy-files/schema.sql ]; then
      echo "Importing /deploy-files/schema.sql into ${DB_NAME}"
      if psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -f /deploy-files/schema.sql; then
        echo "Schema imported successfully"
      else
        echo "Schema import failed; migrations may still be attempted"
      fi
    else
      echo "/deploy-files/schema.sql not found; skipping schema import"
    fi
  else
    echo "Table 'usuarios' exists; skipping schema import"
  fi
else
  echo "Target database does not exist or is not reachable; attempting to create it using schema fallback"
  # Extrair nome do DB e construir uma URL apontando para o banco 'postgres' para poder criar o DB
  CREATE_DB_URL="${DATABASE_URL%/*}/postgres"

  echo "Creating database '${DB_NAME}' using connection '${CREATE_DB_URL}'"
  # Tenta criar o banco (pode falhar se j\u00e1 existir)
  if psql "${CREATE_DB_URL}" -v ON_ERROR_STOP=1 -c "CREATE DATABASE \"${DB_NAME}\";" >/dev/null 2>&1; then
    echo "Database '${DB_NAME}' created"
  else
    echo "Create database command failed; continuing to attempt schema import if possible"
  fi

  # Se houver um arquivo de schema fornecido em /deploy-files/schema.sql, importa para o novo DB
  if [ -f /deploy-files/schema.sql ]; then
    echo "Found /deploy-files/schema.sql  importing into ${DB_NAME}"
    if psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -f /deploy-files/schema.sql; then
      echo "Schema imported successfully"
    else
      echo "Schema import failed  migrations may still be attempted"
    fi
  else
    echo "/deploy-files/schema.sql not found; skipping schema import"
  fi
fi

# Rodar migrações (assumindo diesel CLI disponível)
if command -v diesel >/dev/null 2>&1; then
  echo "Running diesel migrations..."
  if diesel migration run --migration-dir /app/migrations; then
    echo "Diesel migrations finished"
  else
    echo "Diesel migrations failed; exiting with non-zero status"
    exit 1
  fi
else
  echo "diesel CLI not found; skipping migrations"
fi

# Start backend
exec /usr/local/bin/backend
