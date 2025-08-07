#[cfg(test)]
mod tests {
    use ulid::Ulid;

    #[tokio::test]
    async fn test_dashboard_stats_handler() {
        let user_id = Ulid::new().to_string();
        let filtro = super::DashboardFiltro {
            id_usuario: user_id.clone(),
            periodo: None,
            data_inicio: None,
            data_fim: None,
            tipo: None,
            categoria: None,
        };
        let resp = super::dashboard_stats_handler(axum::extract::Query(filtro)).await;
        let stats = resp.0;
        // Todos os valores devem ser zero ou None
        assert_eq!(stats.ganhos_hoje, 0);
        assert_eq!(stats.gastos_hoje, 0);
        assert_eq!(stats.lucro_hoje, 0);
        assert_eq!(stats.corridas_hoje, 0);
        assert_eq!(stats.horas_hoje, 0);
        assert_eq!(stats.eficiencia, 0);
        assert_eq!(stats.ganhos_semana, 0);
        assert_eq!(stats.gastos_semana, 0);
        assert_eq!(stats.lucro_semana, 0);
        assert_eq!(stats.corridas_semana, 0);
        assert_eq!(stats.horas_semana, 0);
        assert!(stats.meta_diaria.is_none());
        assert!(stats.meta_semanal.is_none());
        assert_eq!(stats.tendencia_ganhos, 0);
        assert_eq!(stats.tendencia_gastos, 0);
        assert_eq!(stats.tendencia_corridas, 0);
    }
}
use axum::{Json, extract::Query};
use serde::Deserialize;
use serde::Serialize;
use chrono::{Utc, Duration, NaiveDateTime};
use diesel::prelude::*;
use crate::schema::transacoes::dsl as transacao_dsl;
use crate::schema::sessoes_trabalho::dsl as sessao_dsl;
use crate::schema::metas::dsl as meta_dsl;
use crate::db;
use crate::models::configuracao::Configuracao;
use crate::schema::configuracoes::dsl as config_dsl;

#[derive(Serialize)]
pub struct DashboardStats {
    pub ganhos_hoje: i32,
    pub gastos_hoje: i32,
    pub lucro_hoje: i32,
    pub corridas_hoje: u32,
    pub horas_hoje: i32,
    pub eficiencia: i32,
    pub ganhos_semana: i32,
    pub gastos_semana: i32,
    pub lucro_semana: i32,
    pub corridas_semana: u32,
    pub horas_semana: i32,
    pub meta_diaria: Option<i32>,
    pub meta_semanal: Option<i32>,
    pub tendencia_ganhos: i32,
    pub tendencia_gastos: i32,
    pub tendencia_corridas: i32,
}

#[derive(Deserialize)]
pub struct DashboardFiltro {
    pub id_usuario: String,
    pub periodo: Option<String>, // "mensal", "semanal", "anual", "custom"
    pub data_inicio: Option<NaiveDateTime>,
    pub data_fim: Option<NaiveDateTime>,
    pub tipo: Option<String>, // "entrada", "saida"
    pub categoria: Option<String>,
}

pub async fn dashboard_stats_handler(Query(filtro): Query<DashboardFiltro>) -> Json<DashboardStats> {
    let conn = &mut db::establish_connection();
    let now = Utc::now().naive_utc();
    // Buscar configurações do usuário
    let configs: Vec<Configuracao> = config_dsl::configuracoes
        .filter(config_dsl::id_usuario.eq(&filtro.id_usuario))
        .load(conn)
        .unwrap_or_default();
    // Função utilitária para buscar config
    let get_config = |chave: &str| -> Option<String> {
        configs.iter().find(|c| c.chave == chave).and_then(|c| c.valor.clone())
    };
    let projecao_metodo = get_config("projecao_metodo").unwrap_or_else(|| "media".to_string());
    let projecao_percentual_extremos: usize = get_config("projecao_percentual_extremos").and_then(|v| v.parse().ok()).unwrap_or(10);

    let (inicio, fim) = match filtro.periodo.as_deref() {
        Some("mensal") => {
            let inicio = NaiveDateTime::new(now.date() - Duration::days(30), chrono::NaiveTime::from_hms_opt(0,0,0).unwrap());
            (inicio, now)
        },
        Some("semanal") => {
            let inicio = NaiveDateTime::new(now.date() - Duration::days(7), chrono::NaiveTime::from_hms_opt(0,0,0).unwrap());
            (inicio, now)
        },
        Some("anual") => {
            let inicio = NaiveDateTime::new(now.date() - Duration::days(365), chrono::NaiveTime::from_hms_opt(0,0,0).unwrap());
            (inicio, now)
        },
        Some("custom") => {
            let inicio = filtro.data_inicio.unwrap_or(now);
            let fim = filtro.data_fim.unwrap_or(now);
            (inicio, fim)
        },
        _ => {
            let inicio = NaiveDateTime::new(now.date(), chrono::NaiveTime::from_hms_opt(0,0,0).unwrap());
            (inicio, now)
        }
    };

    let mut ganhos_query = transacao_dsl::transacoes
        .filter(transacao_dsl::id_usuario.eq(&filtro.id_usuario))
        .filter(transacao_dsl::data.ge(inicio))
        .filter(transacao_dsl::data.le(fim))
        .filter(transacao_dsl::tipo.eq("entrada"))
        .into_boxed();
    let mut gastos_query = transacao_dsl::transacoes
        .filter(transacao_dsl::id_usuario.eq(&filtro.id_usuario))
        .filter(transacao_dsl::data.ge(inicio))
        .filter(transacao_dsl::data.le(fim))
        .filter(transacao_dsl::tipo.eq("saida"))
        .into_boxed();
    if let Some(ref categoria) = filtro.categoria {
        ganhos_query = ganhos_query.filter(transacao_dsl::id_categoria.eq(categoria));
        gastos_query = gastos_query.filter(transacao_dsl::id_categoria.eq(categoria));
    }
    // Buscar todos os valores de ganhos para cálculo customizado
    let ganhos_valores: Vec<i32> = ganhos_query.select(transacao_dsl::valor).load(conn).unwrap_or_default();
    let ganhos: i32 = if projecao_metodo == "mediana" {
        // Cálculo por mediana
        let mut v = ganhos_valores.clone();
        v.sort();
        let len = v.len();
        if len == 0 {
            0
        } else if len % 2 == 1 {
            v[len / 2]
        } else {
            (v[len / 2 - 1] + v[len / 2]) / 2
        }
    } else {
        // Cálculo por média, excluindo extremos se configurado
        let mut v = ganhos_valores.clone();
        v.sort();
        let len = v.len();
        let excluir = (len * projecao_percentual_extremos / 100).min(len / 2);
        let v_filtrado = if excluir > 0 && len > 2 * excluir {
            v[excluir..len-excluir].to_vec()
        } else {
            v
        };
        if v_filtrado.is_empty() {
            0
        } else {
            v_filtrado.iter().sum::<i32>() / v_filtrado.len() as i32
        }
    };
    let gastos: i32 = gastos_query.select(diesel::dsl::sum(transacao_dsl::valor)).first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as i32;
    let lucro = ganhos - gastos;
    let corridas: u32 = sessao_dsl::sessoes_trabalho.filter(sessao_dsl::id_usuario.eq(&filtro.id_usuario)).filter(sessao_dsl::inicio.ge(inicio)).filter(sessao_dsl::inicio.le(fim)).select(diesel::dsl::sum(sessao_dsl::total_corridas)).first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as u32;
    let minutos: i32 = sessao_dsl::sessoes_trabalho.filter(sessao_dsl::id_usuario.eq(&filtro.id_usuario)).filter(sessao_dsl::inicio.ge(inicio)).filter(sessao_dsl::inicio.le(fim)).select(diesel::dsl::sum(sessao_dsl::total_minutos)).first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as i32;
    let horas = minutos / 60;
    let total_metas: i32 = meta_dsl::metas.filter(meta_dsl::id_usuario.eq(&filtro.id_usuario)).count().get_result::<i64>(conn).unwrap_or(0) as i32;
    let metas_concluidas: i32 = meta_dsl::metas.filter(meta_dsl::id_usuario.eq(&filtro.id_usuario)).filter(meta_dsl::eh_concluida.eq(true)).count().get_result::<i64>(conn).unwrap_or(0) as i32;
    let eficiencia = if total_metas > 0 { (metas_concluidas * 100) / total_metas } else { 0 };
    let meta_diaria = meta_dsl::metas.filter(meta_dsl::id_usuario.eq(&filtro.id_usuario)).filter(meta_dsl::eh_ativa.eq(true)).order_by(meta_dsl::data_inicio.desc()).select(meta_dsl::valor_alvo).first::<i32>(conn).ok();
    let meta_semanal = meta_dsl::metas.filter(meta_dsl::id_usuario.eq(&filtro.id_usuario)).filter(meta_dsl::eh_ativa.eq(true)).order_by(meta_dsl::data_inicio.desc()).select(meta_dsl::valor_alvo).first::<i32>(conn).ok();
    let stats = DashboardStats {
        ganhos_hoje: ganhos,
        gastos_hoje: gastos,
        lucro_hoje: lucro,
        corridas_hoje: corridas,
        horas_hoje: horas,
        eficiencia,
        ganhos_semana: ganhos,
        gastos_semana: gastos,
        lucro_semana: lucro,
        corridas_semana: corridas,
        horas_semana: horas,
        meta_diaria,
        meta_semanal,
        tendencia_ganhos: 0,
        tendencia_gastos: 0,
        tendencia_corridas: 0,
    };
    Json(stats)
}

