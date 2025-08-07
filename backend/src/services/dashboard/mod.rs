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
        assert_eq!(stats.ganhos_hoje, 0.0);
        assert_eq!(stats.gastos_hoje, 0.0);
        assert_eq!(stats.lucro_hoje, 0.0);
        assert_eq!(stats.corridas_hoje, 0);
        assert_eq!(stats.horas_hoje, 0.0);
        assert_eq!(stats.eficiencia, 0.0);
        assert_eq!(stats.ganhos_semana, 0.0);
        assert_eq!(stats.gastos_semana, 0.0);
        assert_eq!(stats.lucro_semana, 0.0);
        assert_eq!(stats.corridas_semana, 0);
        assert_eq!(stats.horas_semana, 0.0);
        assert!(stats.meta_diaria.is_none());
        assert!(stats.meta_semanal.is_none());
        assert_eq!(stats.tendencia_ganhos, 0.0);
        assert_eq!(stats.tendencia_gastos, 0.0);
        assert_eq!(stats.tendencia_corridas, 0.0);
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

#[derive(Serialize)]
pub struct DashboardStats {
    pub ganhos_hoje: f64,
    pub gastos_hoje: f64,
    pub lucro_hoje: f64,
    pub corridas_hoje: u32,
    pub horas_hoje: f64,
    pub eficiencia: f64,
    pub ganhos_semana: f64,
    pub gastos_semana: f64,
    pub lucro_semana: f64,
    pub corridas_semana: u32,
    pub horas_semana: f64,
    pub meta_diaria: Option<f64>,
    pub meta_semanal: Option<f64>,
    pub tendencia_ganhos: f64,
    pub tendencia_gastos: f64,
    pub tendencia_corridas: f64,
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
    let ganhos: f64 = ganhos_query.select(diesel::dsl::sum(transacao_dsl::valor)).first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as f64;
    let gastos: f64 = gastos_query.select(diesel::dsl::sum(transacao_dsl::valor)).first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as f64;
    let lucro = ganhos - gastos;
    let corridas: u32 = sessao_dsl::sessoes_trabalho.filter(sessao_dsl::id_usuario.eq(&filtro.id_usuario)).filter(sessao_dsl::inicio.ge(inicio)).filter(sessao_dsl::inicio.le(fim)).select(diesel::dsl::sum(sessao_dsl::total_corridas)).first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as u32;
    let minutos: i64 = sessao_dsl::sessoes_trabalho.filter(sessao_dsl::id_usuario.eq(&filtro.id_usuario)).filter(sessao_dsl::inicio.ge(inicio)).filter(sessao_dsl::inicio.le(fim)).select(diesel::dsl::sum(sessao_dsl::total_minutos)).first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0);
    let horas = minutos as f64 / 60.0;
    let total_metas: i64 = meta_dsl::metas.filter(meta_dsl::id_usuario.eq(&filtro.id_usuario)).count().get_result(conn).unwrap_or(0);
    let metas_concluidas: i64 = meta_dsl::metas.filter(meta_dsl::id_usuario.eq(&filtro.id_usuario)).filter(meta_dsl::eh_concluida.eq(true)).count().get_result(conn).unwrap_or(0);
    let eficiencia = if total_metas > 0 { (metas_concluidas as f64 / total_metas as f64) * 100.0 } else { 0.0 };
    let meta_diaria = meta_dsl::metas.filter(meta_dsl::id_usuario.eq(&filtro.id_usuario)).filter(meta_dsl::eh_ativa.eq(true)).order_by(meta_dsl::data_inicio.desc()).select(meta_dsl::valor_alvo).first::<i32>(conn).ok().map(|v| v as f64);
    let meta_semanal = meta_dsl::metas.filter(meta_dsl::id_usuario.eq(&filtro.id_usuario)).filter(meta_dsl::eh_ativa.eq(true)).order_by(meta_dsl::data_inicio.desc()).select(meta_dsl::valor_alvo).first::<i32>(conn).ok().map(|v| v as f64);
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
        tendencia_ganhos: 0.0,
        tendencia_gastos: 0.0,
        tendencia_corridas: 0.0,
    };
    Json(stats)
}

