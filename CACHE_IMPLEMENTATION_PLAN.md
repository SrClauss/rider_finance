# Sistema de Cache Inteligente - Rider Finance

## Análise do Projeto Atual

### Estrutura Identificada
- **Backend**: Rust (Axum) com Diesel ORM e PostgreSQL
- **Transações**: CRUD completo com paginação e filtros
- **Dashboard**: Cálculos complexos de estatísticas (ganhos, gastos, lucros, corridas, horas)
- **Relatórios**: Geração de PDF/XLSX
- **Cache atual**: Vazio (`backend/src/utils/cache.rs`)

### Problemas Performance Identificados
1. **Dashboard**: Cálculos caros executados a cada requisição
2. **Transações**: Queries repetitivas para primeira página
3. **Agregações**: Soma de períodos (hoje, ontem, semana, mês) recalculadas
4. **Tendências**: Regressão linear e médias móveis recalculadas
5. **Relatórios**: Queries complexas sem cache

## Objetivos do Sistema de Cache

### Requisitos Funcionais
- ✅ Cache de primeira página de transações por usuário
- ✅ Cache de dashboard stats completo por usuário  
- ✅ Cache incremental para novas transações
- ✅ Invalidação inteligente por operações CRUD
- ✅ Cache de agregações por períodos
- ✅ Cache de tendências e projeções
- ✅ Expiração configurável por tipo de cache
- ✅ Fallback para DB em caso de miss

### Requisitos Não-Funcionais
- ✅ Latência < 50ms para hits
- ✅ Memória controlada (max 512MB)
- ✅ Thread-safe para concorrência
- ✅ Métricas de hit/miss ratio
- ✅ Logs de operações de cache

## Arquitetura do Sistema

### 1. Estrutura de Cache (Moka)

O plano foi reduzido para **dois caches principais** para atender ao requisito declarado:

- Cache de Transações: mantém até **20 entradas por usuário** (ex.: páginas/prefetches)
- Cache de Dashboard: mantém **1 entrada por usuário** (dashboard completo pré-calculado)

Observação: o `moka` controla capacidade global; o limite por-usuário será aplicado logicamente (veja seção de implementação abaixo) — por exemplo mantendo uma lista de chaves por usuário e removendo as mais antigas quando o limite for atingido.

```rust
// Tipos de cache simplificados
pub enum CacheType {
    TransactionList, // Lista paginada de transações (p.ex. page=1, filtros)
    DashboardStats,  // Dashboard completo por usuário
}

// Estrutura de caches usados pela aplicação
pub struct RiderCache {
    // cache global para transações (chave inclui user_id + page + filtros)
    pub transactions: moka::future::Cache<String, PaginatedTransacoes>,
    // cache global para dashboard (chave = user_id)
    pub dashboard: moka::future::Cache<String, DashboardStats>,
}
```

### 2. Estratégias de Cache por Endpoint

#### A. Cache de Transações (`list_transacoes_handler`)
```rust
// Chave: user_id:page:filters_hash
// TTL: 5 minutos
// Invalidação: CREATE, UPDATE, DELETE transação

async fn get_cached_transactions(
    user_id: &str, 
    page: usize, 
    filters: &TransacaoFiltro
) -> Option<PaginatedTransacoes> {
    let key = format!("{}:{}:{}", user_id, page, hash_filters(filters));
    CACHE.transactions.get(&key).await
}
```

#### B. Cache de Dashboard (`dashboard_stats_handler`)  
```rust
// Chave: user_id:dashboard:date_range
// TTL: 30 minutos
// Invalidação: CREATE, UPDATE, DELETE transação/sessão

async fn get_cached_dashboard(user_id: &str) -> Option<DashboardStats> {
    let key = format!("{}:dashboard", user_id);
    CACHE.dashboard.get(&key).await
}
```

#### C. Cache de Agregações Periódicas
```rust
// Chaves especializadas por período
// user_id:period:YYYY-MM-DD (diário)
// user_id:period:YYYY-WW (semanal)  
// user_id:period:YYYY-MM (mensal)
// TTL: 1 hora (diário), 6 horas (semanal), 24 horas (mensal)

pub struct PeriodAggregation {
    ganhos: i32,
    gastos: i32,
    lucro: i32,
    corridas: u32,
    horas: i32,
    periodo: String,
    data: NaiveDateTime,
}
```

### 3. Sistema de Cache Incremental

#### Fluxo de Inserção de Transação
```rust
async fn create_transacao_with_cache(payload: CreateTransacaoPayload, user_id: String) {
    // 1. Inserir no banco
    let nova_transacao = insert_transaction(payload).await;
    
    // 2. Atualizar cache incremental
    update_dashboard_incremental(&user_id, &nova_transacao).await;
    update_period_cache_incremental(&user_id, &nova_transacao).await;
    
    // 3. Invalidar caches específicos
    invalidate_user_caches(&user_id, CacheType::TransactionList).await;
}

async fn update_dashboard_incremental(user_id: &str, transacao: &Transacao) {
    if let Some(mut cached_dashboard) = get_cached_dashboard(user_id).await {
        // Aplicar mudança incremental
        match transacao.tipo.as_str() {
            "entrada" => {
                cached_dashboard.ganhos_hoje = Some(
                    cached_dashboard.ganhos_hoje.unwrap_or(0) + transacao.valor
                );
                // Atualizar outros campos relevantes...
            },
            "saida" => {
                cached_dashboard.gastos_hoje = Some(
                    cached_dashboard.gastos_hoje.unwrap_or(0) + transacao.valor
                );
            },
            _ => {}
        }
        
        // Salvar versão atualizada
        cache_dashboard(user_id, cached_dashboard).await;
    }
}
```

#### Fluxo de Update/Delete de Transação
```rust
async fn update_transacao_with_cache(id: String, payload: UpdateTransacaoPayload, user_id: String) {
    // 1. Buscar transação original
    let original = get_transacao_original(&id).await;
    
    // 2. Aplicar update no banco
    let updated = update_transaction(id, payload).await;
    
    // 3. Calcular delta e aplicar ao cache
    apply_transaction_delta(&user_id, &original, &updated).await;
}

async fn delete_transacao_with_cache(id: String, user_id: String) {
    // 1. Buscar transação a ser deletada
    let transacao = get_transacao_original(&id).await;
    
    // 2. Deletar do banco
    delete_transaction(id).await;
    
    // 3. Reverter valores do cache
    revert_transaction_from_cache(&user_id, &transacao).await;
}
```

### 4. Implementação Detalhada

#### A. Configuração do Cache (Moka)
```rust
// backend/src/utils/cache.rs
use moka::future::Cache;
use std::time::Duration;

pub struct CacheConfig {
    pub max_capacity: u64,
    pub time_to_live: Duration,
    pub time_to_idle: Duration,
}

impl Default for CacheConfig {
    fn default() -> Self {
        Self {
            max_capacity: 10_000,
            time_to_live: Duration::from_secs(1800), // 30 min
            time_to_idle: Duration::from_secs(300),  // 5 min
        }
    }
}

lazy_static::lazy_static! {
    // Nota: max_capacity é global; aplicaremos controle fino por usuário em camada adicional
    pub static ref TRANSACTION_CACHE: moka::future::Cache<String, PaginatedTransacoes> = 
        moka::future::Cache::builder()
            .max_capacity(50_000) // capacidade global; cada usuário limitado a 20 entradas via bookkeeping
            .time_to_live(Duration::from_secs(300)) // 5 min
            .build();

    pub static ref DASHBOARD_CACHE: moka::future::Cache<String, DashboardStats> = 
        moka::future::Cache::builder()
            .max_capacity(10_000) // capacidade global; cada usuário terá apenas 1 entrada lógica
            .time_to_live(Duration::from_secs(1800)) // 30 min
            .build();
}
```

#### B. Utilitários de Cache
```rust
// Geração de chaves padronizadas
pub fn generate_transaction_key(user_id: &str, page: usize, filters: &TransacaoFiltro) -> String {
    let filters_hash = calculate_filters_hash(filters);
    format!("tx:{}:{}:{}", user_id, page, filters_hash)
}

pub fn generate_dashboard_key(user_id: &str) -> String {
    format!("dash:{}", user_id)
}

pub fn generate_period_key(user_id: &str, period_type: &str, date: &str) -> String {
    format!("period:{}:{}:{}", user_id, period_type, date)
}

// Hash de filtros para detectar mudanças
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

fn calculate_filters_hash(filters: &TransacaoFiltro) -> u64 {
    let mut hasher = DefaultHasher::new();
    filters.id_categoria.hash(&mut hasher);
    filters.descricao.hash(&mut hasher);
    filters.tipo.hash(&mut hasher);
    filters.data_inicio.hash(&mut hasher);
    filters.data_fim.hash(&mut hasher);
    hasher.finish()
}
```

#### C. Middleware de Cache
```rust
// Middleware para injetar cache automaticamente
pub async fn cache_middleware<B>(
    request: Request<B>,
    next: Next<B>,
) -> Result<Response, StatusCode> {
    let cache_key = extract_cache_key(&request);
    
    // Try cache first
    if let Some(cached_response) = try_get_cached_response(&cache_key).await {
        return Ok(cached_response);
    }
    
    // Execute handler
    let response = next.run(request).await;
    
    // Cache successful responses
    if response.status().is_success() {
        cache_response(&cache_key, &response).await;
    }
    
    Ok(response)
}
```

### 5. Estratégias de Invalidação

#### A. Invalidação por Padrão de Chave
```rust
pub async fn invalidate_user_pattern(user_id: &str, pattern: &str) {
    let keys_to_remove: Vec<String> = TRANSACTION_CACHE
        .run_pending_tasks()
        .await;
    
    // Implementar varredura de chaves com pattern matching
    for key in keys_matching_pattern(user_id, pattern).await {
        TRANSACTION_CACHE.remove(&key).await;
    }
}

// Exemplos de invalidação
// Transação criada: invalidate_user_pattern(user_id, "tx:*")
// Dashboard: invalidate_user_pattern(user_id, "dash:*")
// Período específico: invalidate_user_pattern(user_id, "period:*:daily:2025-09-07")
```

#### B. Invalidação Inteligente por Contexto
```rust
pub async fn invalidate_transaction_related_caches(user_id: &str, transacao: &Transacao) {
    // Invalidar listas de transações
    invalidate_user_pattern(user_id, "tx:*").await;
    
    // Invalidar dashboard
    invalidate_dashboard_cache(user_id).await;
    
    // Invalidar agregações do período da transação
    let date_str = transacao.data.format("%Y-%m-%d").to_string();
    invalidate_period_cache(user_id, "daily", &date_str).await;
    
    // Invalidar semana e mês se necessário
    let week_str = transacao.data.format("%Y-%U").to_string();
    let month_str = transacao.data.format("%Y-%m").to_string();
    invalidate_period_cache(user_id, "weekly", &week_str).await;
    invalidate_period_cache(user_id, "monthly", &month_str).await;
}
```

### 6. Métricas e Observabilidade

```rust
#[derive(Debug, Serialize)]
pub struct CacheMetrics {
    pub hits: u64,
    pub misses: u64,
    pub hit_ratio: f64,
    pub entries: u64,
    pub memory_usage: u64,
    pub last_reset: chrono::DateTime<chrono::Utc>,
}

pub async fn get_cache_metrics() -> CacheMetrics {
    let tx_hits = TRANSACTION_CACHE.hit_count();
    let tx_misses = TRANSACTION_CACHE.miss_count();
    
    CacheMetrics {
        hits: tx_hits,
        misses: tx_misses,
        hit_ratio: tx_hits as f64 / (tx_hits + tx_misses) as f64,
        entries: TRANSACTION_CACHE.entry_count(),
        memory_usage: TRANSACTION_CACHE.weighted_size(),
        last_reset: chrono::Utc::now(),
    }
}

// Endpoint para métricas
pub async fn cache_metrics_handler() -> Json<CacheMetrics> {
    Json(get_cache_metrics().await)
}
```

## Plano de Implementação

### Fase 1: Fundação (Semana 1)
- [ ] Adicionar dependência `moka` no `Cargo.toml`
- [ ] Implementar estruturas básicas de cache (`cache.rs`)
- [ ] Criar utilitários de chave e hash
- [ ] Testes unitários básicos

### Fase 2: Cache de Transações (Semana 2)
- [ ] Implementar cache na `list_transacoes_handler`
- [ ] Adicionar invalidação em CRUD de transações
- [ ] Testes de integração
- [ ] Métricas básicas

### Fase 3: Cache de Dashboard (Semana 3)  
- [ ] Cache completo da `dashboard_stats_handler`
- [ ] Implementar sistema incremental
- [ ] Cache de agregações periódicas
- [ ] Testes de performance

### Fase 4: Otimizações (Semana 4)
- [ ] Middleware automático de cache
- [ ] Invalidação inteligente avançada
- [ ] Métricas e observabilidade completa
- [ ] Documentação e benchmarks

### Fase 5: Monitoramento (Semana 5)
- [ ] Dashboard de métricas de cache
- [ ] Alertas de performance
- [ ] Ajuste fino de configurações
- [ ] Deploy em produção

## Configurações Recomendadas

### Variáveis de Ambiente
```env
# Cache Configuration
CACHE_MAX_CAPACITY=10000
CACHE_TTL_SECONDS=1800
CACHE_TTI_SECONDS=300
CACHE_METRICS_ENABLED=true

# Performance Tuning  
CACHE_DASHBOARD_TTL=1800
CACHE_TRANSACTION_TTL=300
CACHE_PERIOD_TTL=3600
```

### Dependency Updates
```toml
# Cargo.toml
[dependencies]
moka = { version = "0.12", features = ["future"] }
lazy_static = "1.4"
tokio = { version = "1", features = ["rt-multi-thread", "macros"] }
serde = { version = "1.0", features = ["derive"] }
```

## Benefícios Esperados

### Performance
- ⚡ **Dashboard**: 90% redução no tempo de resposta (de ~500ms para ~50ms)
- ⚡ **Transações**: 80% redução para primeira página (de ~200ms para ~40ms)
- ⚡ **Agregações**: 95% redução para períodos cached (de ~300ms para ~15ms)

### Recursos
- 📉 **CPU**: 60% redução na carga de DB queries
- 📉 **DB Connections**: 70% redução no pool de conexões
- 📊 **Throughput**: 3x aumento na capacidade de usuários simultâneos

### Experiência
- 🚀 **UX**: Interface mais responsiva
- 🎯 **Confiabilidade**: Fallback automático para DB
- 📈 **Escalabilidade**: Suporte a mais usuários sem degradação

## Riscos e Mitigações

### Riscos Identificados
1. **Consistência**: Cache desatualizado vs DB
   - **Mitigação**: Invalidação imediata + TTL baixo
2. **Memória**: Crescimento descontrolado do cache
   - **Mitigação**: Limits de capacidade + monitoramento
3. **Complexidade**: Sistema mais difícil de debugar
   - **Mitigação**: Logs detalhados + métricas

### Plano de Rollback
- Feature flag para habilitar/desabilitar cache
- Fallback automático para queries diretas
- Scripts de limpeza de cache
- Monitoramento de consistência entre cache e DB

---

**Status**: 📋 Planejamento Completo
**Próximo Passo**: Implementação Fase 1 - Fundação
**Estimativa Total**: 5 semanas
**ROI Esperado**: 200% melhoria de performance
