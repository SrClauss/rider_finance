
use tracing::{info, debug, warn};
use crate::{cache::{types::*, RIDER_CACHE}, cache_key};
use crate::services::dashboard::service::DashboardStats;

pub async fn get_cached_dashboard(user_id: &str) -> Option<DashboardStats> {
    let key = cache_key!(dashboard, user_id);
    
    dev_println!("🔍 CACHE-DASHBOARD: Buscando cache de dashboard para usuário: {}", user_id);
    
    if let Some(stats) = RIDER_CACHE.dashboard.get(&key).await {
    dev_println!("✅ CACHE-DASHBOARD: Cache HIT! Dashboard encontrado para usuário: {}", user_id);
    dev_println!("📊 CACHE-DASHBOARD: Dados encontrados - Ganhos hoje: {:?}, Gastos hoje: {:?}", 
        stats.ganhos_hoje, stats.gastos_hoje);
        debug!("Cache hit: dashboard para usuário {}", user_id);
        return Some(stats);
    }
    
    dev_println!("❌ CACHE-DASHBOARD: Cache MISS! Nenhum dashboard em cache para usuário: {}", user_id);
    debug!("Cache miss: dashboard para usuário {}", user_id);
    None
}

/// Salva dashboard stats no cache
pub async fn save_dashboard_to_cache(user_id: &str, dashboard_stats: &DashboardStats) {
    let key = cache_key!(dashboard, user_id);
    
    dev_println!("💾 CACHE-DASHBOARD: Salvando dashboard no cache para usuário: {}", user_id);
    dev_println!("📊 CACHE-DASHBOARD: Dados sendo salvos - Ganhos hoje: {:?}, Gastos hoje: {:?}, Lucro hoje: {:?}", 
            dashboard_stats.ganhos_hoje, dashboard_stats.gastos_hoje, dashboard_stats.lucro_hoje);
    
    RIDER_CACHE.dashboard.insert(key, dashboard_stats.clone()).await;
    
    dev_println!("✅ CACHE-DASHBOARD: Dashboard salvo com sucesso no cache para usuário: {}", user_id);
    info!("Dashboard salvo no cache para usuário {}", user_id);
}

/// Aplica uma transação aos stats do dashboard (cálculo incremental)
pub fn apply_transaction_to_dashboard(dashboard: &mut DashboardStats, transacao: &TransacaoCached) {
    // Frontend já envia valores em centavos, não precisamos multiplicar por 100
    let valor = transacao.transacao.valor;
    
    dev_println!("🔄 CACHE-DASHBOARD: Aplicando transação incremental ao dashboard");
    dev_println!("📝 CACHE-DASHBOARD: Transação - ID: {}, Tipo: {}, Valor: {} centavos", 
        transacao.transacao.id, transacao.transacao.tipo, valor);
    dev_println!("📊 CACHE-DASHBOARD: Estado ANTES - Ganhos hoje: {:?}, Gastos hoje: {:?}", 
        dashboard.ganhos_hoje, dashboard.gastos_hoje);
    
    match transacao.transacao.tipo.as_str() {
        "entrada" => {
            dev_println!("➕ CACHE-DASHBOARD: Processando transação de ENTRADA");
            // Adicionar aos ganhos (valor já vem em centavos do frontend)
            dashboard.ganhos_hoje = Some(dashboard.ganhos_hoje.unwrap_or(0) + valor);
            dashboard.ganhos_ontem = Some(dashboard.ganhos_ontem.unwrap_or(0) + valor);
            dashboard.ganhos_semana = Some(dashboard.ganhos_semana.unwrap_or(0) + valor);
            dashboard.ganhos_mes = Some(dashboard.ganhos_mes.unwrap_or(0) + valor);
            
            dev_println!("🏁 CACHE-DASHBOARD: Incrementando contadores de corridas - eventos: {}", transacao.transacao.eventos);
            // Incrementar contadores se aplicável
            dashboard.corridas_hoje = Some(dashboard.corridas_hoje.unwrap_or(0) + transacao.transacao.eventos as u32);
            dashboard.corridas_ontem = Some(dashboard.corridas_ontem.unwrap_or(0) + transacao.transacao.eventos as u32);
            dashboard.corridas_semana = Some(dashboard.corridas_semana.unwrap_or(0) + transacao.transacao.eventos as u32);
            dashboard.corridas_mes = Some(dashboard.corridas_mes.unwrap_or(0) + transacao.transacao.eventos as u32);
        }
        "saida" => {
            dev_println!("➖ CACHE-DASHBOARD: Processando transação de SAÍDA");
            // Adicionar aos gastos (valor já vem em centavos do frontend)
            let valor_gasto = valor.abs();
            dev_println!("💸 CACHE-DASHBOARD: Valor absoluto para gastos: {} centavos", valor_gasto);
            
            dashboard.gastos_hoje = Some(dashboard.gastos_hoje.unwrap_or(0) + valor_gasto);
            dashboard.gastos_ontem = Some(dashboard.gastos_ontem.unwrap_or(0) + valor_gasto);
            dashboard.gastos_semana = Some(dashboard.gastos_semana.unwrap_or(0) + valor_gasto);
            dashboard.gastos_mes = Some(dashboard.gastos_mes.unwrap_or(0) + valor_gasto);
        }
        _ => {
            println!("⚠️ CACHE-DASHBOARD: ATENÇÃO! Tipo de transação desconhecido: {}", transacao.transacao.tipo);
            warn!("Tipo de transação desconhecido: {} para usuário", transacao.transacao.tipo);
        }
    }
    
    dev_println!("📊 CACHE-DASHBOARD: Estado APÓS aplicar transação - Ganhos hoje: {:?}, Gastos hoje: {:?}", 
            dashboard.ganhos_hoje, dashboard.gastos_hoje);
    
    // Recalcular lucros
    dev_println!("🧮 CACHE-DASHBOARD: Recalculando lucros...");
    recalculate_profits(dashboard);
    
    dev_println!("✅ CACHE-DASHBOARD: Transação aplicada com sucesso - Lucro hoje calculado: {:?}", 
            dashboard.lucro_hoje);
    
    debug!("Transação aplicada incrementalmente ao dashboard: {} de valor {}", 
           transacao.transacao.tipo, valor);
}

/// Recalcula os lucros baseado nos ganhos e gastos atuais
fn recalculate_profits(dashboard: &mut DashboardStats) {
    dev_println!("🧮 CACHE-DASHBOARD: Iniciando recálculo de lucros");
    
    if let (Some(ganhos), Some(gastos)) = (dashboard.ganhos_hoje, dashboard.gastos_hoje) {
        dashboard.lucro_hoje = Some(ganhos - gastos);
    dev_println!("📈 CACHE-DASHBOARD: Lucro hoje = {} - {} = {}", ganhos, gastos, ganhos - gastos);
    }
    if let (Some(ganhos), Some(gastos)) = (dashboard.ganhos_ontem, dashboard.gastos_ontem) {
        dashboard.lucro_ontem = Some(ganhos - gastos);
    dev_println!("📈 CACHE-DASHBOARD: Lucro ontem = {} - {} = {}", ganhos, gastos, ganhos - gastos);
    }
    if let (Some(ganhos), Some(gastos)) = (dashboard.ganhos_semana, dashboard.gastos_semana) {
        dashboard.lucro_semana = Some(ganhos - gastos);
    dev_println!("📈 CACHE-DASHBOARD: Lucro semana = {} - {} = {}", ganhos, gastos, ganhos - gastos);
    }
    if let (Some(ganhos), Some(gastos)) = (dashboard.ganhos_mes, dashboard.gastos_mes) {
        dashboard.lucro_mes = Some(ganhos - gastos);
    dev_println!("📈 CACHE-DASHBOARD: Lucro mês = {} - {} = {}", ganhos, gastos, ganhos - gastos);
    }
    
    dev_println!("✅ CACHE-DASHBOARD: Recálculo de lucros concluído");
}

/// Calcula dashboard de forma incremental usando apenas transações novas
pub async fn calculate_dashboard_incremental(user_id: &str) -> Option<DashboardStats> {
    dev_println!("🚀 CACHE-DASHBOARD: Iniciando cálculo incremental para usuário: {}", user_id);
    
    // Buscar dashboard em cache
    let mut cached_dashboard = match get_cached_dashboard(user_id).await {
        Some(dashboard) => {
            dev_println!("✅ CACHE-DASHBOARD: Dashboard base encontrado em cache");
            dashboard
        },
        None => {
            dev_println!("❌ CACHE-DASHBOARD: Nenhum dashboard em cache - não é possível fazer cálculo incremental");
            debug!("Nenhum dashboard em cache para usuário {}", user_id);
            return None;
        }
    };
    
    // Buscar transações novas
    dev_println!("🔍 CACHE-DASHBOARD: Buscando transações novas...");
    let new_transactions = match crate::cache::transacao::get_new_transactions(user_id).await {
        Some(transactions) if !transactions.is_empty() => {
            dev_println!("📝 CACHE-DASHBOARD: Encontradas {} transações novas para processar", transactions.len());
            transactions
        },
        Some(_transactions) => {
            dev_println!("📝 CACHE-DASHBOARD: Nenhuma transação nova encontrada - retornando cache existente");
            return Some(cached_dashboard);
        },
        None => {
            dev_println!("❌ CACHE-DASHBOARD: Falha ao buscar transações novas - retornando cache existente");
            debug!("Nenhuma transação nova para usuário {}", user_id);
            return Some(cached_dashboard); // Retorna cache existente
        }
    };
    
    dev_println!("🔄 CACHE-DASHBOARD: Processando {} transações novas incrementalmente", new_transactions.len());
    info!("Calculando dashboard incrementalmente para usuário {} com {} transações novas", 
          user_id, new_transactions.len());
    
    // Aplicar cada transação nova ao dashboard
    for (index, transaction) in new_transactions.iter().enumerate() {
        dev_println!("🔄 CACHE-DASHBOARD: Processando transação {}/{} - ID: {}", 
                index + 1, new_transactions.len(), transaction.transacao.id);
        apply_transaction_to_dashboard(&mut cached_dashboard, transaction);
    }
    
    // Marcar transações como processadas
    dev_println!("✅ CACHE-DASHBOARD: Marcando {} transações como processadas", new_transactions.len());
    crate::cache::transacao::mark_transactions_as_processed(user_id).await;
    
    // Salvar dashboard atualizado no cache
    dev_println!("💾 CACHE-DASHBOARD: Salvando dashboard atualizado no cache");
    save_dashboard_to_cache(user_id, &cached_dashboard).await;
    
    dev_println!("🎉 CACHE-DASHBOARD: Cálculo incremental concluído com sucesso para usuário: {}", user_id);
    dev_println!("📊 CACHE-DASHBOARD: Resultado final - Ganhos hoje: {:?}, Gastos hoje: {:?}, Lucro hoje: {:?}", 
            cached_dashboard.ganhos_hoje, cached_dashboard.gastos_hoje, cached_dashboard.lucro_hoje);
    
    info!("Dashboard incremental calculado e salvo para usuário {}", user_id);
    Some(cached_dashboard)
}

/// Limpa cache de dashboard de um usuário específico
pub async fn clear_user_dashboard_cache(user_id: &str) {
    let key = cache_key!(dashboard, user_id);
    
    dev_println!("🗑️ CACHE-DASHBOARD: Limpando cache de dashboard para usuário: {}", user_id);
    RIDER_CACHE.dashboard.remove(&key).await;
    dev_println!("✅ CACHE-DASHBOARD: Cache de dashboard limpo com sucesso para usuário: {}", user_id);
    
    info!("Cache de dashboard limpo para usuário {}", user_id);
}

/// Limpa ambos os caches de um usuário (mecanismo de segurança)
pub async fn clear_user_caches(user_id: &str) {
    dev_println!("🚨 MECANISMO DE SEGURANÇA: Limpando TODOS os caches para usuário: {}", user_id);
    
    crate::cache::transacao::clear_user_transaction_cache(user_id).await;
    clear_user_dashboard_cache(user_id).await;
    
    dev_println!("⚠️ MECANISMO DE SEGURANÇA: Todos os caches foram limpos para usuário: {}", user_id);
    warn!("MECANISMO DE SEGURANÇA: todos os caches limpos para usuário {}", user_id);
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use crate::models::transacao::Transacao;
    
    fn create_test_dashboard() -> DashboardStats {
        DashboardStats {
            ganhos_hoje: Some(10000),
            ganhos_ontem: Some(9000),
            ganhos_semana: Some(50000),
            ganhos_mes: Some(200000),
            gastos_hoje: Some(2000),
            gastos_ontem: Some(1500),
            gastos_semana: Some(10000),
            gastos_mes: Some(40000),
            lucro_hoje: Some(8000),
            lucro_ontem: Some(7500),
            lucro_semana: Some(40000),
            lucro_mes: Some(160000),
            corridas_hoje: Some(10),
            corridas_ontem: Some(8),
            corridas_semana: Some(50),
            corridas_mes: Some(200),
            ..Default::default()
        }
    }
    
    fn create_test_transacao_cached(valor: i32, tipo: &str) -> TransacaoCached {
        let transacao = Transacao {
            id: "test_tx".to_string(),
            id_usuario: "test_user".to_string(),
            id_categoria: "cat1".to_string(),
            valor,
            eventos: 1,
            descricao: Some("Teste".to_string()),
            tipo: tipo.to_string(),
            data: Utc::now().naive_utc(),
            criado_em: Utc::now().naive_utc(),
            atualizado_em: Utc::now().naive_utc(),
        };
        
        TransacaoCached::from_transacao(transacao, true)
    }
    
    #[tokio::test]
    async fn test_apply_entrada_transaction() {
        let mut dashboard = create_test_dashboard();
        let transacao = create_test_transacao_cached(50, "entrada");
        
        apply_transaction_to_dashboard(&mut dashboard, &transacao);
        
        assert_eq!(dashboard.ganhos_hoje, Some(10050)); // 10000 + 50 (valores em centavos)
        assert_eq!(dashboard.corridas_hoje, Some(11)); // 10 + 1
        assert_eq!(dashboard.lucro_hoje, Some(8050)); // 10050 - 2000
    }
    
    #[tokio::test]
    async fn test_apply_saida_transaction() {
        let mut dashboard = create_test_dashboard();
        let transacao = create_test_transacao_cached(-30, "saida");
        
        apply_transaction_to_dashboard(&mut dashboard, &transacao);

    assert_eq!(dashboard.gastos_hoje, Some(5000)); // 2000 + 3000 (valor absoluto)
    assert_eq!(dashboard.lucro_hoje, Some(5000)); // 10000 - 5000
    }
}
