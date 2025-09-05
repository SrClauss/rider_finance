Baseline migration

Este diretório contém uma migração "baseline" sem alterações (no-op). Ela serve para marcar o estado atual do schema como ponto de partida para o controle de migrações com Diesel.

Por que usar:
- Permite começar a versionar migrações mesmo com um banco existente em produção/staging.
- Evita a necessidade de gerar migrações que descrevam todo o schema atual.

Como aplicar:
1) Faça backup do banco de dados (backup completo) antes de rodar migrações.
2) Instale e configure o `diesel` CLI no ambiente onde vai executar as migrações (ou rode via container/CI que já tenha o CLI).
3) No diretório `backend`, execute:

```pwsh
# entrar na pasta backend
cd backend

# rodar migrações (marca esta baseline como aplicada)
diesel migration run
```

Observações:
- A migração é propositalmente um no-op. O comando acima criará a tabela de controle de migrações (`__diesel_schema_migrations` ou similar) e registrará essa migração como aplicada.
- Depois disso, você pode adicionar novas migrações incrementais (ex.: criação de tabelas `broadcast`, `broadcast_user`, `ticket`) em subpastas numeradas dentro de `backend/migrations`.
- Se preferir não executar `diesel migration run`, você pode manualmente inserir um registro na tabela de controle de migrações, mas isso normalmente não é necessário.
