## Implementação sequencial e executável — Cache da Dashboard (Moka)

Apresentação geral (visão sem código)

Resumo executivo
- Implementaremos um cache em memória local que acelera a rota da dashboard e as primeiras páginas de listagem de transações, sem introduzir serviços externos (Redis, pub/sub). O foco é reduzir latência para o usuário, reduzir carga de leitura no banco e manter comportamento previsível e reversível.

Escopo funcional
- Cache de payloads da dashboard por combinação `user_id + filtro` (Moka).
- Cache de transações recentes por `user_id` (estrutura local limitada a ~20 itens, em memória, com DashMap + VecDeque) para acelerar páginas iniciais.
- Comportamento esperado:
  - Ao criar uma transação: registrar resumo em `recent cache` e aplicar atualização incremental da dashboard quando possível.
  - Ao editar/deletar: invalidar entradas afetadas e recomputar quando necessário.
  - Leitura da dashboard: usar cache como base e aplicar merge incremental com itens recentes antes de responder.

Restrições e decisões arquiteturais
- Cache local apenas: solução single-node; não sincronizada entre instâncias. Se houver múltiplas instâncias, a consistência cai e será necessária evolução para pub/sub externo.
- Estratégia conservadora de consistência: prefira invalidar+recompute para cenários ambíguos (edição/deleção complexa).
- Evitar alterações invasivas no modelo de dados; pequenas funções de merge incremental e snapshots locais.

Critérios de sucesso (MVP)
- Redução perceptível da latência das rotas alvo em ambiente de staging.
- Taxa de acerto de cache (cache_hit) observável e com comportamento estável.
- Testes unitários e de integração automáticos cobrindo os caminhos principais.
- Feature flag para ativar/desativar o cache em runtime/config.

Entregáveis
- Documento de design (este checklist + plano técnico).
- Módulo `backend/src/services/dashboard/cache.rs` com API pública para get/insert/invalidate/clear.
- Integração nos handlers de transação (create/update/delete) e na rota de listagem paginada.
- Testes unitários e de integração.
- Métricas básicas e feature flag para rollout controlado.

Princípios de implementação
- Pequenas entregas e commits atômicos.
- Testes primeiro para funções críticas (merge incremental, push/clear).
- Instrumentação mínima (logs/metrics) desde o início para facilitar rollback/observability.

## Instruções rápidas

1. **Criar o módulo**: `backend/src/services/dashboard/cache.rs`.
2. **Definir a API pública**:
   - `get(user_id, filtro)`: retorna payload da dashboard.
   - `insert(user_id, filtro, payload)`: insere/atualiza payload no cache.
   - `invalidate(user_id, filtro)`: invalida cache para o filtro.
   - `clear()`: limpa todo o cache.
3. **Integrar com handlers**:
   - Ao criar/atualizar/deletar transações, chamar `invalidate` ou `insert` conforme necessário.
   - Na leitura da dashboard, chamar `get` e aplicar merge com dados recentes.
4. **Testar**:
   - Garantir que os testes cubram os novos caminhos de código.
   - Verificar comportamento do cache em diferentes cenários (criação, edição, deleção de transações).
5. **Monitorar**:
   - Observar métricas de desempenho e taxa de acerto do cache após a implementação.
   - Ajustar estratégia de cache conforme necessário, baseado no comportamento observado em produção.


   ## Instruções para interação

   - Evite usar cargo check e foque nas alterações usando o rust-analizer, use o cargo check apenas
   quando o rust analizer não conseguir resolver os erros e quando um grupo for iterado

  - Evite parar a iteração, abaixo eu listarei todos os passos que precisam ser feitos, estes passos precisam ser seguidos na sequencia

  - Eventualmente acontece de nas iterações, a corrupção de arquivos, para qualquer arquivo existente, antes de começar a iterar, crie um backup.txt dele e em caso de erros de sintasse que corrompam a estrutura do arquivo restaure o backup, reflita sobre o que fez esta corrupção e reinicie a iteração

  - Esta sessão vai estar aberta para outras instruções gerais


## Checklist com as alterações em sequencia

Use este checklist em ordem absoluta; marque cada caixa quando a tarefa estiver concluída.

- [ ] Etapa 0 — Preparação inicial
  - [ ] 0.1 Criar branch de trabalho: `git checkout -b feat/dashboard-cache`
  - [ ] 0.2 Fazer backup de arquivos sensíveis antes de editar (ex.: `cp backend/src/services/dashboard/cache.rs backup_cache.rs`)
  - [ ] 0.3 Atualizar dependências do workspace no `backend/Cargo.toml` (não commitar ainda)

- [ ] Etapa 1 — Dependências e verificação
  - [ ] 1.1 Adicionar nas `[dependencies]` de `backend/Cargo.toml`: `moka = "0.11"`, `dashmap = "5"`, `once_cell = "1"`
  - [ ] 1.2 Rodar `cd backend && cargo check` e corrigir erros menores
  - [ ] 1.3 Commit: `git add backend/Cargo.toml && git commit -m "chore(dashboard): add moka/dashmap deps"`

- [ ] Etapa 2 — Esqueleto do módulo de cache
  - [ ] 2.1 Criar arquivo `backend/src/services/dashboard/cache.rs` com assinatura do módulo e tipos básicos (`RecentTx`, `DashboardKey`)
  - [ ] 2.2 Exportar o módulo em `backend/src/services/dashboard/mod.rs` (adicionar `pub mod cache;`)
  - [ ] 2.3 Commit do esqueleto: `git add backend/src/services/dashboard/cache.rs backend/src/services/dashboard/mod.rs && git commit -m "feat(dashboard): add cache module skeleton"`
  - [ ] 2.4 Rodar `cargo check` e ajustar erros de compilação iniciais

- [ ] Etapa 3 — Implementar recent cache (push/clear/snapshot)
  - [ ] 3.1 Adicionar `RECENT_TX_CACHE: DashMap<String, VecDeque<RecentTx>>` (static) e funções auxiliares privadas
  - [ ] 3.2 Implementar `pub fn push_recent_tx(user_id: &str, tx: RecentTx) -> bool` que retorna `NeedsRecompute` (true se esvaziou)
  - [ ] 3.3 Implementar `pub fn clear_recent_tx(user_id: &str)`
  - [ ] 3.4 Implementar `pub fn get_recent_snapshot(user_id: &str) -> Vec<RecentTx>` (retornar clone/vec ordenado)
  - [ ] 3.5 Escrever testes unitários em `backend/tests/recent_tx_cache.rs` cobrindo push, overflow (20) e get_snapshot
  - [ ] 3.6 Commit e rodar testes: `cargo test -p backend -- tests::recent_tx_cache && git add . && git commit -m "feat(dashboard): recent cache impl + tests"`

- [ ] Etapa 4 — Implementar dashboard cache e merge incremental
  - [ ] 4.1 Adicionar `DASHBOARD_CACHE: moka::future::Cache<String, Arc<DashboardResponse>>` (static)
  - [ ] 4.2 Implementar `pub async fn get_cached_dashboard(key: &str, loader: impl Future<Output = DashboardResponse>) -> Arc<DashboardResponse>` (usar `get_with`)
  - [ ] 4.3 Implementar `merge_incremental(base: &mut DashboardResponse, recent: &[RecentTx])` que aplica mudanças apenas nos campos relevantes
  - [ ] 4.4 Garantir que `get_cached_dashboard` chama `get_recent_snapshot`, aplica `merge_incremental` e retorna a cópia atualizada (sem persistir duplicatas)
  - [ ] 4.5 Escrever testes unitários para `merge_incremental`
  - [ ] 4.6 Commit e rodar testes: `cargo test -p backend -- tests::merge_incremental && git add . && git commit -m "feat(dashboard): cache + merge incremental"`

- [ ] Etapa 5 — Integração com handlers de transação
  - [ ] 5.1 `create_transacao_handler`: após inserir no DB, construir `RecentTx` e chamar `if push_recent_tx(user_id, tx) { invalidate_dashboard_keys_for_user(user_id) } else { spawn task to apply incremental update }`
  - [ ] 5.2 `update_transacao_handler` / `delete_transacao_handler`: chamar `invalidate_dashboard_keys_for_user(user_id); clear_recent_tx(user_id)`
  - [ ] 5.3 Implementar `invalidate_dashboard_keys_for_user(user_id)` que encontra e invalida keys relevantes no `DASHBOARD_CACHE`
  - [ ] 5.4 Commit e testes de integração básicos: `cargo test -p backend -- tests::transacao_handlers && git add . && git commit -m "feat(transacao): integrate recent cache and invalidation"`

- [ ] Etapa 6 — Paginação acelerada usando recent cache
  - [ ] 6.1 Implementar `pub fn get_recent_page(user_id: &str, page: usize, page_size: usize) -> Vec<RecentTx>` que retorna snapshot paginada (mais recente primeiro)
  - [ ] 6.2 Atualizar `list_transacoes_handler` para primeiro checar `get_recent_page` e, se suficiente, retornar a página do cache
  - [ ] 6.3 Quando parcial, combinar `recent` + query ao DB garantindo ausência de duplicatas (filtrar por `tx_id`)
  - [ ] 6.4 Escrever testes de integração cobrindo página completa, parcial e vazia
  - [ ] 6.5 Commit: `cargo test -p backend -- tests::transacoes_pagination_cache && git add . && git commit -m "feat(transacao): pagination uses recent cache"`

- [ ] Etapa 7 — Métricas, logs e feature flag
  - [ ] 7.1 Adicionar métricas básicas (`cache_hit`, `cache_miss`, `incremental_update_success`, `incremental_update_fail`) via o sistema de métricas do projeto
  - [ ] 7.2 Adicionar logs `debug` nas operações principais de cache
  - [ ] 7.3 Implementar `DASHBOARD_CACHE_ENABLED` (env var) e verificar seu uso em runtime
  - [ ] 7.4 Commit: `git add . && git commit -m "feat(dashboard): add metrics and feature flag"`

- [ ] Etapa 8 — Testes finais e rollout controlado
  - [ ] 8.1 Executar suíte completa: `cargo test` e corrigir falhas
  - [ ] 8.2 Deploy para staging com `DASHBOARD_CACHE_ENABLED=true` e monitorar métricas por 48-72h
  - [ ] 8.3 Coletar feedback e corrigir problemas; preparar PR para produção
  - [ ] 8.4 Merge e monitorar produção com rollback pronto

- [ ] Etapa 9 — Documentação e limpeza
  - [ ] 9.1 Atualizar `DASHBOARD_CACHE_PLAN.md` com detalhes de implementação
  - [ ] 9.2 Documentar limites, trade-offs e próximos passos no repo
  - [ ] 9.3 Commit final: `git add . && git commit -m "docs(dashboard): update plan and checklist"`



