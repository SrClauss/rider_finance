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

### Fluxo de Uso Definido (Atualizado)
1. **Primeiro acesso Dashboard**: Handler salva resultado no cache.
2. **Primeiro acesso Transações**: Handler grava 20 transações no cache (VecDeque), marcando-as como `new: true`.
3. **Volta ao Dashboard**: Handler verifica o cache e calcula de forma incremental com base nas transações marcadas como `new: true`. Após o cálculo, todas as transações `new` são marcadas como `false`.
4. **Volta a Transações**: Primeira página vem do cache.
5. **Nova Transação**: Inserção no cache (VecDeque remove última automaticamente e marca a nova transação como `new: true`).
6. **Segunda/Terceira página**: Segunda vem do cache, terceira vai ao DB.
7. **Edição/Deleção**: Invalidam ambos os caches.

### Requisitos Funcionais (Atualizados)
- ✅ Cache de transações usando VecDeque (máximo 20 transações por usuário).
- ✅ Cache de dashboard stats completo por usuário.
- ✅ Parâmetro booleano `new` para controle incremental em transações.
- ✅ Dashboard calcula de forma incremental com base em transações `new`.
- ✅ Após cálculo, transações `new` são marcadas como `false`.
- ✅ Invalidação de ambos os caches para edição/deleção.
- ✅ Fallback para DB quando não há cache

### Requisitos Não-Funcionais
- ✅ Latência < 50ms para hits
- ✅ Memória controlada
- ✅ Thread-safe para concorrência
- ✅ Logs de operações de cache

## Checklist de Implementação

### Fase 1: Estrutura Base do Cache
- [ ] Criar módulo `src/cache/mod.rs` com estruturas principais
- [ ] Criar `src/cache/types.rs` com tipos de dados do cache
- [ ] Implementar estrutura global do cache com Moka
- [ ] Definir chaves de cache padronizadas

### Fase 2: Cache de Transações (`src/cache/transacao.rs`)
- [ ] Implementar estrutura `TransactionCacheData` com VecDeque
- [ ] Implementar tipo `TransacaoCached` que estende `Transacao` com propriedade `new: bool`
- [ ] Função `get_cached_transactions(user_id, page)` - retorna dados para páginas 1 e 2 apenas
- [ ] Função `add_new_transaction(user_id, transaction)` - adiciona no início da VecDeque e remove do final se > 20
- [ ] Função `mark_transactions_as_processed(user_id)` - marca todas as transações `new` como `false`
- [ ] Função `get_new_transactions(user_id)` - retorna apenas transações com `new: true`
- [ ] Mecanismo de segurança: se >= 20 transações novas, invalidar cache
- [ ] Controle de limite de 20 transações no VecDeque com contador de transações novas
- [ ] Logs de operações de cache de transações

### Fase 3: Cache de Dashboard (`src/cache/dashboard.rs`)  
- [ ] Implementar estrutura `DashboardStats`
- [ ] Função `get_cached_dashboard(user_id)` 
- [ ] Função `calculate_dashboard_incremental(user_id)` - processa apenas transações `new: true`
- [ ] Função `apply_transaction_to_dashboard(dashboard, transaction)` - aplica uma transação aos stats
- [ ] Função `save_dashboard_to_cache(user_id, dashboard_stats)`  
- [ ] Função `clear_user_caches(user_id)` - limpa ambos os caches (mecanismo de segurança)
- [ ] TTL configurável para dashboard (30 minutos)
- [ ] Logs de operações de cache de dashboard

### Fase 4: Integração com Handlers
- [ ] Modificar `dashboard_stats_handler` para usar cálculo incremental baseado em transações `new`
- [ ] Modificar `list_transacoes_handler` para usar cache apenas nas páginas 1 e 2
- [ ] Modificar `create_transacao_handler` para adicionar ao cache com `new: true` (sem invalidar dashboard)
- [ ] Modificar `update_transacao_handler` para invalidar ambos os caches
- [ ] Modificar `delete_transacao_handler` para invalidar ambos os caches
- [ ] Implementar mecanismo de segurança: >= 20 transações novas força recálculo completo
- [ ] Garantir que edição/deleção invalida ambos os caches conforme especificado

### Fase 5: Testes e Otimizações
- [ ] Testes unitários para módulos de cache
- [ ] Testes de integração com handlers
- [ ] Métricas de hit/miss ratio
- [ ] Logs de performance e debugging
- [ ] Documentação do sistema de cache

## Arquitetura do Sistema

### 1. Estrutura de Cache com VecDeque

**Dois caches principais usando Moka para armazenar as estruturas de dados:**

- **Cache de Transações**: Armazena `TransactionCacheData` com VecDeque interno (máximo 20 transações por usuário)
- **Cache de Dashboard**: Armazena `DashboardStats` por usuário

```rust
// Estrutura principal do cache
pub struct RiderCache {
    // Cache por usuário - cada entrada contém um VecDeque com até 20 transações
    pub transactions: moka::future::Cache<String, Arc<RwLock<TransactionCacheData>>>,
    // Cache de dashboard por usuário  
    pub dashboard: moka::future::Cache<String, DashboardStats>,
}

// Cada usuário tem uma estrutura com VecDeque de transações
pub struct TransactionCacheData {
    pub transactions: VecDeque<TransacaoCached>, // Máximo 20 transações
    pub last_updated: DateTime<Utc>,
    pub total_new_transactions: usize, // Contador de transações novas adicionadas
}

// Transação estendida com propriedade 'new'
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransacaoCached {
    #[serde(flatten)]
    pub transacao: Transacao, // Todas as propriedades originais
    pub new: bool,           // Propriedade booleana para controle incremental
}
```

### 2. Fluxo de Cache Implementado

#### A. Primeiro Acesso às Transações
```rust
async fn list_transacoes_handler(user_id: &str, page: usize) -> Result<Vec<Transacao>, Error> {
    if page <= 2 {
        // Páginas 1 e 2: tentar cache primeiro
        if let Some(cached) = get_cached_transactions(user_id, page).await {
            return Ok(cached);
        }
    }
    
    // Cache miss ou página > 2: buscar no DB
    let transactions = fetch_from_db(user_id, page).await?;
    
    // Se é primeira página, salvar no cache
    if page == 1 {
        save_transactions_to_cache(user_id, &transactions).await;
    }
    
    Ok(transactions)
}
```

#### B. Dashboard com Cálculo Incremental  
```rust
async fn dashboard_stats_handler(user_id: &str) -> Result<DashboardStats, Error> {
    // Verificar se há dashboard em cache
    if let Some(mut cached_dashboard) = get_cached_dashboard(user_id).await {
        // Verificar se há transações novas para processar
        if let Some(new_transactions) = get_new_transactions(user_id).await {
            if new_transactions.len() >= 20 {
                // MECANISMO DE SEGURANÇA: Se 20+ transações novas, limpar cache e recalcular tudo
                clear_user_caches(user_id).await;
                return calculate_dashboard_from_db(user_id).await;
            }
            
            // Cálculo incremental com transações novas
            for transaction in &new_transactions {
                apply_transaction_to_dashboard(&mut cached_dashboard, transaction);
            }
            
            // Marcar todas as transações como processadas (new = false)
            mark_transactions_as_processed(user_id).await;
            
            // Atualizar cache do dashboard
            save_dashboard_to_cache(user_id, &cached_dashboard).await;
            return Ok(cached_dashboard);
        }
        
        return Ok(cached_dashboard);
    }
    
    // Cache miss: calcular do zero
    let dashboard = calculate_dashboard_from_db(user_id).await?;
    save_dashboard_to_cache(user_id, &dashboard).await;
    Ok(dashboard)
}
```

#### C. Criação de Nova Transação
```rust
async fn create_transacao_handler(payload: CreateTransacaoPayload, user_id: String) -> Result<Transacao, Error> {
    // 1. Inserir no banco
    let nova_transacao = insert_transaction_db(payload).await?;
    
    // 2. Adicionar ao cache com new = true
    add_transaction_to_cache(&user_id, &nova_transacao, true).await;
    
    // 3. NÃO invalidar dashboard - ele será calculado incrementalmente no próximo acesso
    
    Ok(nova_transacao)
}

async fn add_transaction_to_cache(user_id: &str, transacao: &Transacao, new: bool) {
    let cached_transaction = TransacaoCached {
        transacao: transacao.clone(),
        new,
    };
    
    if let Some(cache_data) = get_user_transaction_cache(user_id).await {
        let mut data = cache_data.write().await;
        
        // Adicionar no início da VecDeque
        data.transactions.push_front(cached_transaction);
        data.total_new_transactions += if new { 1 } else { 0 };
        
        // Remover última se exceder 20
        if data.transactions.len() > 20 {
            if let Some(removed) = data.transactions.pop_back() {
                if removed.new {
                    data.total_new_transactions = data.total_new_transactions.saturating_sub(1);
                }
            }
        }
        
        data.last_updated = Utc::now();
    }
}
```

### 3. Mecanismos de Segurança e Invalidação

#### A. Mecanismo de Segurança - 20 Transações Novas
```rust
async fn check_cache_safety(user_id: &str) -> bool {
    if let Some(cache_data) = get_user_transaction_cache(user_id).await {
        let data = cache_data.read().await;
        if data.total_new_transactions >= 20 {
            // Cache não é mais confiável - VecDeque pode ter descartado dados novos
            return false;
        }
    }
    true
}
```

#### B. Invalidação para Edição/Deleção
```rust
async fn update_transacao_handler(id: i32, payload: UpdateTransacaoPayload, user_id: String) -> Result<Transacao, Error> {
    // 1. Atualizar no banco
    let updated = update_transaction_db(id, payload).await?;
    
    // 2. Invalidar ambos os caches
    invalidate_user_caches(&user_id).await;
    
    Ok(updated)
}

async fn delete_transacao_handler(id: i32, user_id: String) -> Result<(), Error> {
    // 1. Deletar do banco
    delete_transaction_db(id).await?;
    
    // 2. Invalidar ambos os caches  
    invalidate_user_caches(&user_id).await;
    
    Ok(())
}

async fn invalidate_user_caches(user_id: &str) {
    let tx_key = format!("transactions:{}", user_id);
    let dashboard_key = format!("dashboard:{}", user_id);
    
    RIDER_CACHE.transactions.remove(&tx_key).await;
    RIDER_CACHE.dashboard.remove(&dashboard_key).await;
}
```
