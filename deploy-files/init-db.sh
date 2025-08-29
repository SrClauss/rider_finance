#!/bin/bash
set -e

# Aguardar o PostgreSQL estar pronto
until pg_isready -U postgres -d ride; do
  echo "Aguardando PostgreSQL estar pronto..."
  sleep 2
done

echo "PostgreSQL está pronto. Executando schema..."

# Executar o schema se as tabelas não existirem
psql -U postgres -d ride -c "SELECT 1 FROM categorias LIMIT 1" 2>/dev/null || {
  echo "Executando schema.sql..."
  psql -U postgres -d ride -f /docker-entrypoint-initdb.d/01-schema.sql
  echo "Schema executado com sucesso!"
}

echo "Banco de dados 'ride' está pronto com todas as tabelas!"
