# PR Checklist: Outbox + Cache-aside Feature

Use esta checklist ao abrir o PR para a implementação de `outbox` + cache-aside.

- [ ] Migração `outbox` criada e validada
  - [ ] `up.sql` cria tabela `outbox` com colunas corretas
  - [ ] `down.sql` reverte mudanças
  - [ ] Extensão `pgcrypto` criada ou documentada
  - [ ] Índice parcial para `processed = false` está presente
  - [ ] Constraint de payload adicionada (se aplicável)

- [ ] Worker
  - [ ] Binary `outbox_worker` adicionado (esqueleto funcional)
  - [ ] Worker processa lote e marca `processed=true`
  - [ ] Cleanup/retention configurável implementado
  - [ ] Logs e métricas básicas adicionados
  - [ ] Worker processa payload e executa invalidação de cache

- [ ] Redis
  - [ ] Redis pool/helper criado e documentado (env vars)
  - [ ] Handlers usam cache-aside com chaves determinísticas e TTL configuráveis
  - [ ] Endpoints críticos têm testes de cache hit/miss

- [ ] Escritas transacionais
  - [ ] Operações que modificam dados (insert/update/delete) também gravam no `outbox` dentro da mesma transação
  - [ ] Payloads do outbox são validados (tamanho/shape)

- [ ] Observability e operação
  - [ ] Métricas: pending_rows, processed_rate, worker_errors, cache_hit_rate
  - [ ] Alertas definidos para outbox lag alto e worker failures
  - [ ] Runbook com comandos de purga e reprocessamento incluído

- [ ] Testes
  - [ ] Testes unitários para handler cache-aside e key generation
  - [ ] Testes integrados para fluxo write -> outbox -> worker -> invalidation
  - [ ] Smoke/load tests documentados

- [ ] Rollout
  - [ ] Migration aplicada em staging e verificada
  - [ ] Worker rodando em staging com métricas visíveis
  - [ ] Canário planejado e aprovado

Comentários adicionais:
- Se houver infra constraints (ex.: sem pg_cron), favor indicar para ajustar a implementação (worker-based cleanup).

