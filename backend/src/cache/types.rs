//! Tipos de dados utilizados pelo sistema de cache

use std::collections::VecDeque;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use crate::models::transacao::Transacao;

/// Transação estendida com propriedade `new` para controle incremental
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransacaoCached {
    /// Todas as propriedades originais da transação
    #[serde(flatten)]
    pub transacao: Transacao,
    /// Flag indicando se é uma transação nova (não processada pelo dashboard)
    pub new: bool,
}

impl TransacaoCached {
    /// Cria uma TransacaoCached a partir de uma Transacao
    pub fn from_transacao(transacao: Transacao, new: bool) -> Self {
        Self {
            transacao,
            new,
        }
    }
    
    /// Marca a transação como processada (new = false)
    pub fn mark_as_processed(&mut self) {
        self.new = false;
    }
}

/// Dados do cache de transações usando VecDeque para controle de fila
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionCacheData {
    /// VecDeque com máximo de 20 transações (mais recentes no início)  
    pub transactions: VecDeque<TransacaoCached>,
    /// Flag indicando se há dados novos não processados
    pub has_new_data: bool,
    /// Timestamp da última atualização
    pub last_updated: DateTime<Utc>,
    /// Página atual representada pelo cache (geralmente página 1)
    pub current_page: usize,
    /// Total de itens quando o cache foi criado (para paginação)
    pub total_items: Option<i64>,
    /// Contador de transações novas (flag new=true)
    pub total_new_transactions: usize,
}

impl TransactionCacheData {
    /// Cria um novo cache de transações vazio
    pub fn new() -> Self {
        Self {
            transactions: VecDeque::with_capacity(20),
            has_new_data: false,
            last_updated: Utc::now(),
            current_page: 1,
            total_items: None,
            total_new_transactions: 0,
        }
    }
    
    /// Adiciona uma nova transação no início da fila (remove a última se > 20)
    pub fn add_transaction(&mut self, transaction: Transacao) {
        let cached_transaction = TransacaoCached::from_transacao(transaction, true);
        self.transactions.push_front(cached_transaction);
        
        // Remove a última se exceder 20 transações
        if self.transactions.len() > 20 {
            self.transactions.pop_back();
        }
        
        self.total_new_transactions += 1;
        self.has_new_data = true;
        self.last_updated = Utc::now();
    }
    
    /// Substitui todas as transações (usado no primeiro carregamento)
    pub fn set_transactions(&mut self, transactions: Vec<Transacao>, page: usize, total: Option<i64>) {
        self.transactions.clear();
        for transaction in transactions {
            let cached_transaction = TransacaoCached::from_transacao(transaction, false);
            self.transactions.push_back(cached_transaction);
        }
        
        // Garante que não exceda 20 transações
        self.transactions.truncate(20);
        
        self.current_page = page;
        self.total_items = total;
        self.total_new_transactions = 0;
        self.has_new_data = false;
        self.last_updated = Utc::now();
    }
    
    /// Retorna apenas as transações marcadas como "new"
    pub fn get_new_transactions(&self) -> Vec<TransacaoCached> {
        self.transactions.iter()
            .filter(|t| t.new)
            .cloned()
            .collect()
    }
    
    /// Marca todas as transações como processadas (new = false)
    pub fn mark_all_as_processed(&mut self) {
        for transaction in &mut self.transactions {
            transaction.new = false;
        }
        self.total_new_transactions = 0;
        self.has_new_data = false;
        self.last_updated = Utc::now();
    }
    
    /// Verifica se há muitas transações novas (>=15 trigger para invalidar cache do dashboard)
    pub fn has_too_many_new_transactions(&self) -> bool {
        self.total_new_transactions >= 15
    }
    
    /// Obtém uma página específica das transações em cache
    pub fn get_page(&self, page: usize, page_size: usize) -> Vec<Transacao> {
        // Calcula intervalo baseado em página e tamanho da página
        let start = (page.saturating_sub(1)).saturating_mul(page_size);
        self.transactions
            .iter()
            .skip(start)
            .take(page_size)
            .map(|t| t.transacao.clone())
            .collect()
    }
    
    /// Remove uma transação específica do cache
    pub fn remove_transaction(&mut self, transaction_id: &str) -> bool {
        if let Some(pos) = self.transactions.iter().position(|t| t.transacao.id == transaction_id) {
            let removed = self.transactions.remove(pos).unwrap();
            if removed.new {
                self.total_new_transactions = self.total_new_transactions.saturating_sub(1);
            }
            self.last_updated = Utc::now();
            true
        } else {
            false
        }
    }
    
    /// Atualiza uma transação existente no cache
    pub fn update_transaction(&mut self, updated_transaction: Transacao) -> bool {
        let transaction_id = &updated_transaction.id;
        if let Some(pos) = self.transactions.iter().position(|t| t.transacao.id == *transaction_id) {
            let was_new = self.transactions[pos].new;
            self.transactions[pos] = TransacaoCached::from_transacao(updated_transaction, was_new);
            self.last_updated = Utc::now();
            return true;
        }
        false
    }
    
    /// Verifica se o cache está vazio
    pub fn is_empty(&self) -> bool {
        self.transactions.is_empty()
    }
    
    /// Retorna o número de transações em cache
    pub fn len(&self) -> usize {
        self.transactions.len()
    }
}

impl Default for TransactionCacheData {
    fn default() -> Self {
        Self::new()
    }
}

/// Estatísticas de uso do cache
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheStats {
    /// Número de entradas no cache de transações
    pub transactions_entries: u64,
    /// Número de entradas no cache de dashboard
    pub dashboard_entries: u64,
    /// Taxa de hit do cache de transações
    pub transactions_hit_rate: f64,
    /// Taxa de hit do cache de dashboard  
    pub dashboard_hit_rate: f64,
}

/// Resultado de operação de cache
#[derive(Debug, Clone)]
pub enum CacheResult<T> {
    /// Cache hit - dados encontrados
    Hit(T),
    /// Cache miss - dados não encontrados
    Miss,
    /// Erro na operação de cache
    Error(String),
}

impl<T> CacheResult<T> {
    /// Verifica se é um cache hit
    pub fn is_hit(&self) -> bool {
        matches!(self, CacheResult::Hit(_))
    }
    
    /// Verifica se é um cache miss
    pub fn is_miss(&self) -> bool {
        matches!(self, CacheResult::Miss)
    }
    
    /// Extrai o valor se for hit
    pub fn into_option(self) -> Option<T> {
        match self {
            CacheResult::Hit(value) => Some(value),
            _ => None,
        }
    }
}
