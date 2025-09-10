//! Sistema de Cache Inteligente para Rider Finance
//! 
//! Este módulo implementa um sistema de cache em memória usando Moka para:
//! - Cache de transações com VecDeque (máximo 20 por usuário)  
//! - Cache de dashboard stats por usuário
//! - Cálculo incremental baseado em transações com flag `new`

use std::sync::Arc;
use std::time::Duration;
use moka::future::Cache;
use tokio::sync::RwLock;
use tracing::info;

pub mod types;
pub mod transacao;
pub mod dashboard;

use types::*;
use crate::services::dashboard::service::DashboardStats;

/// Cache global singleton para toda a aplicação
pub static RIDER_CACHE: once_cell::sync::Lazy<RiderCache> = 
    once_cell::sync::Lazy::new(RiderCache::new);

/// Estrutura principal do sistema de cache
#[derive(Clone)]
pub struct RiderCache {
    /// Cache de transações por usuário (cada entrada contém VecDeque com até 20 transações)
    pub transactions: Cache<String, Arc<RwLock<TransactionCacheData>>>,
    /// Cache de dashboard stats por usuário
    pub dashboard: Cache<String, DashboardStats>,
}

impl RiderCache {
    /// Cria uma nova instância do cache com configurações padrão
    pub fn new() -> Self {
        info!("Inicializando sistema de cache Rider Finance");
        
        Self {
            // Cache de transações: TTL 30 minutos, máx 1000 usuários
            transactions: Cache::builder()
                .time_to_live(Duration::from_secs(1800)) // 30 minutos
                .max_capacity(1000)
                .build(),
            
            // Cache de dashboard: TTL 30 minutos, máx 1000 usuários  
            dashboard: Cache::builder()
                .time_to_live(Duration::from_secs(1800)) // 30 minutos
                .max_capacity(1000)
                .build(),
        }
    }
    
    /// Invalida todos os caches de um usuário específico
    pub async fn invalidate_user_caches(&self, user_id: &str) {
        info!("Invalidando todos os caches do usuário: {}", user_id);
        
        let tx_key = format!("transactions:{user_id}");
        let dashboard_key = format!("dashboard:{user_id}");
        
        self.transactions.remove(&tx_key).await;
        self.dashboard.remove(&dashboard_key).await;
        
        info!("Caches invalidados para usuário: {}", user_id);
    }
    
    /// Retorna estatísticas de uso do cache
    pub fn get_stats(&self) -> CacheStats {
        CacheStats {
            transactions_entries: self.transactions.entry_count(),
            dashboard_entries: self.dashboard.entry_count(),
            // Moka não expõe hit rate diretamente, usamos valores default por enquanto
            transactions_hit_rate: 0.0,
            dashboard_hit_rate: 0.0,
        }
    }
}

impl Default for RiderCache {
    fn default() -> Self {
        Self::new()
    }
}

/// Macro helper para criar chaves de cache padronizadas
#[macro_export]
macro_rules! cache_key {
    (transactions, $user_id:expr) => {
        format!("transactions:{}", $user_id)
    };
    (dashboard, $user_id:expr) => {
        format!("dashboard:{}", $user_id)  
    };
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_cache_initialization() {
        let cache = RiderCache::new();
        assert_eq!(cache.transactions.entry_count(), 0);
        assert_eq!(cache.dashboard.entry_count(), 0);
    }
    
    #[tokio::test]
    async fn test_cache_key_macro() {
        assert_eq!(cache_key!(transactions, "user123"), "transactions:user123");
        assert_eq!(cache_key!(dashboard, "user456"), "dashboard:user456");
    }
}
