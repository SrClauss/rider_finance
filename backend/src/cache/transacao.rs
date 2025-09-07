//! Módulo de cache para transações
//!
//! Implementa cache com VecDeque para até 20 transações por usuário,
//! com suporte para páginas 1 e 2 apenas, e mecanismo de segurança.

use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, debug, warn};
use crate::{cache_key, cache::{RIDER_CACHE, types::*}};
use crate::models::transacao::Transacao;

/// Obtém transações em cache para uma página específica (apenas páginas 1 e 2)
pub async fn get_cached_transactions(user_id: &str, page: usize, page_size: usize) -> Option<Vec<Transacao>> {
    dev_println!("🔍 CACHE-TRANSACAO: Buscando transações em cache para usuário: {}, página: {}, tamanho: {}", 
            user_id, page, page_size);

    if page > 2 {
        dev_println!("❌ CACHE-TRANSACAO: Cache MISS - página {} > 2 (cache só serve páginas 1 e 2)", page);
        debug!("Cache miss: página {} > 2 para usuário {}", page, user_id);
        return None; // Cache só serve páginas 1 e 2
    }

    let key = cache_key!(transactions, user_id);

    if let Some(cache_data_arc) = RIDER_CACHE.transactions.get(&key).await {
        let cache_data = cache_data_arc.read().await;

        dev_println!("✅ CACHE-TRANSACAO: Cache HIT! Cache encontrado para usuário: {}", user_id);
        dev_println!("📊 CACHE-TRANSACAO: Cache info - Total: {}, Novas: {}, Tem dados novos: {}", 
                cache_data.len(), cache_data.total_new_transactions, cache_data.has_new_data);

        // Sempre retorna Some quando o cache existe (mesmo que vazio),
        // permitindo aos testes verificar presença do cache.
        let transactions = cache_data.get_page(page, page_size);

        dev_println!("📝 CACHE-TRANSACAO: Retornando {} transações da página {}", transactions.len(), page);
        info!("Cache retornou página {} para usuário {} ({} transações)", page, user_id, transactions.len());
        return Some(transactions);
    }

    dev_println!("❌ CACHE-TRANSACAO: Cache MISS - nenhum cache encontrado para usuário: {}", user_id);
    debug!("Cache miss: página {} para usuário {}", page, user_id);
    None
}

/// Adiciona uma nova transação ao cache (no início da VecDeque)
pub async fn add_new_transaction(user_id: &str, transacao: Transacao) {
    let key = cache_key!(transactions, user_id);

    dev_println!("➕ CACHE-TRANSACAO: Adicionando nova transação para usuário: {}", user_id);
    dev_println!("📝 CACHE-TRANSACAO: Transação - ID: {}, Tipo: {}, Valor: {} centavos", 
            transacao.id, transacao.tipo, transacao.valor);

    // Busca ou cria cache_data para o usuário
    let cache_data_arc = RIDER_CACHE.transactions.get_with_by_ref(&key, async {
        dev_println!("🆕 CACHE-TRANSACAO: Criando novo cache de transações para usuário: {}", user_id);
        Arc::new(RwLock::new(TransactionCacheData::new()))
    }).await;

    let mut cache_data = cache_data_arc.write().await;

    dev_println!("📊 CACHE-TRANSACAO: Estado ANTES - Total: {}, Novas: {}", 
            cache_data.len(), cache_data.total_new_transactions);

    // Adiciona transação como nova (new = true)
    cache_data.add_transaction(transacao);

    dev_println!("📊 CACHE-TRANSACAO: Estado APÓS - Total: {}, Novas: {}", 
            cache_data.len(), cache_data.total_new_transactions);

    info!("Nova transação adicionada ao cache para usuário {} (total: {}, novas: {})", 
          user_id, cache_data.len(), cache_data.total_new_transactions);

    // Log de aviso se aproximando do limite de segurança
    if cache_data.total_new_transactions >= 15 {
        dev_println!("⚠️ CACHE-TRANSACAO: ATENÇÃO! Usuário {} tem {} transações novas. Próximo do limite de segurança (20)!", 
              user_id, cache_data.total_new_transactions);
        warn!("Usuário {} tem {} transações novas. Próximo do limite de segurança (20)", 
              user_id, cache_data.total_new_transactions);
    }

    dev_println!("✅ CACHE-TRANSACAO: Nova transação adicionada com sucesso");
}

/// Salva transações iniciais no cache (primeira carga da página)
pub async fn set_cached_transactions(user_id: &str, transactions: Vec<Transacao>) {
    let key = cache_key!(transactions, user_id);

    let cache_data_arc = RIDER_CACHE.transactions.get_with_by_ref(&key, async {
        Arc::new(RwLock::new(TransactionCacheData::new()))
    }).await;

    let mut cache_data = cache_data_arc.write().await;
    cache_data.set_transactions(transactions, 1, None);

    info!("Cache de transações inicializado para usuário {} ({} transações)", 
          user_id, cache_data.len());
}

/// Retorna apenas transações marcadas como novas (new: true)
pub async fn get_new_transactions(user_id: &str) -> Option<Vec<TransacaoCached>> {
    let key = cache_key!(transactions, user_id);

    dev_println!("🔍 CACHE-TRANSACAO: Buscando transações NOVAS para usuário: {}", user_id);

    if let Some(cache_data_arc) = RIDER_CACHE.transactions.get(&key).await {
        let cache_data = cache_data_arc.read().await;
        let new_transactions: Vec<TransacaoCached> = cache_data.get_new_transactions();

        if !new_transactions.is_empty() {
            dev_println!("✅ CACHE-TRANSACAO: Encontradas {} transações novas", new_transactions.len());
            for (index, tx) in new_transactions.iter().enumerate() {
                dev_println!("📝 CACHE-TRANSACAO: Transação nova {}: ID={}, Tipo={}, Valor={}", 
                        index + 1, tx.transacao.id, tx.transacao.tipo, tx.transacao.valor);
            }
            debug!("Encontradas {} transações novas para usuário {}", new_transactions.len(), user_id);
            return Some(new_transactions);
        } else {
            dev_println!("📝 CACHE-TRANSACAO: Nenhuma transação nova encontrada (cache existe mas está vazio)");
        }
    } else {
        dev_println!("❌ CACHE-TRANSACAO: Nenhum cache de transações encontrado para usuário: {}", user_id);
    }

    None
}

/// Marca todas as transações como processadas (new = false)
pub async fn mark_transactions_as_processed(user_id: &str) {
    let key = cache_key!(transactions, user_id);

    dev_println!("✅ CACHE-TRANSACAO: Marcando transações como processadas para usuário: {}", user_id);

    if let Some(cache_data_arc) = RIDER_CACHE.transactions.get(&key).await {
        let mut cache_data = cache_data_arc.write().await;
        let new_count = cache_data.total_new_transactions;

        dev_println!("📊 CACHE-TRANSACAO: Marcando {} transações como processadas", new_count);
        cache_data.mark_all_as_processed();

        dev_println!("✅ CACHE-TRANSACAO: Todas as transações foram marcadas como processadas");
        info!("Marcadas {} transações como processadas para usuário {}", new_count, user_id);
    } else {
        dev_println!("⚠️ CACHE-TRANSACAO: Nenhum cache encontrado para marcar como processado");
    }
}

/// Verifica se há muitas transações novas (mecanismo de segurança)
pub async fn check_cache_safety(user_id: &str) -> bool {
    let key = cache_key!(transactions, user_id);

    if let Some(cache_data_arc) = RIDER_CACHE.transactions.get(&key).await {
        let cache_data = cache_data_arc.read().await;
        if cache_data.has_too_many_new_transactions() {
            dev_println!("� MECANISMO-DE-SEGURANCA: usuário {} tem {} transações novas (>=15).", 
                         user_id, cache_data.total_new_transactions);
            warn!("MECANISMO DE SEGURANÇA: usuário {} tem {} transações novas (>= 15). Cache não confiável.", 
                  user_id, cache_data.total_new_transactions);
            return false;
        }
    }

    true
}

/// Limpa cache de transações de um usuário específico
pub async fn clear_user_transaction_cache(user_id: &str) {
    let key = cache_key!(transactions, user_id);

    dev_println!("🗑️ CACHE-TRANSACAO: Limpando cache de transações para usuário: {}", user_id);
    RIDER_CACHE.transactions.remove(&key).await;
    dev_println!("✅ CACHE-TRANSACAO: Cache de transações limpo com sucesso para usuário: {}", user_id);

    info!("Cache de transações limpo para usuário {}", user_id);
}


#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;

    fn create_test_transacao(id: &str, valor: i32) -> Transacao {
        // Criar uma transação de teste básica
        Transacao {
            id: id.to_string(),
            id_usuario: "test_user".to_string(),
            id_categoria: "cat1".to_string(),
            valor,
            eventos: 1,
            descricao: Some("Teste".to_string()),
            tipo: "entrada".to_string(),
            data: Utc::now().naive_utc(),
            criado_em: Utc::now().naive_utc(),
            atualizado_em: Utc::now().naive_utc(),
        }
    }

    #[tokio::test]
    async fn test_add_and_get_transactions() {
        let user_id = "test_user_1";
        let transacao = create_test_transacao("tx1", 100);

        // Adicionar transação
        add_new_transaction(user_id, transacao.clone()).await;

        // Buscar primeira página
        let result = get_cached_transactions(user_id, 1, 10).await;
        assert!(result.is_some());
        assert_eq!(result.unwrap().len(), 1);
    }

    #[tokio::test]
    async fn test_page_limit() {
        let user_id = "test_user_2";
        let transacao = create_test_transacao("tx1", 100);

        add_new_transaction(user_id, transacao).await;

        // Páginas 1 e 2 devem funcionar
        assert!(get_cached_transactions(user_id, 1, 10).await.is_some());
        assert!(get_cached_transactions(user_id, 2, 10).await.is_some());

        // Página 3 deve retornar None
        assert!(get_cached_transactions(user_id, 3, 10).await.is_none());
    }
}
