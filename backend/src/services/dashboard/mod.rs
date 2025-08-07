use axum::{Json};
use serde::Serialize;
use chrono::{Utc, Duration, NaiveDateTime, Datelike};
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

pub async fn dashboard_stats_handler(id_usuario: String) -> Json<DashboardStats> {
    let conn = &mut db::establish_connection();
    let now = Utc::now().naive_utc();
    let hoje_inicio = NaiveDateTime::new(now.date(), chrono::NaiveTime::from_hms_opt(0,0,0).unwrap());
    let semana_inicio = hoje_inicio - Duration::days(now.date().weekday().num_days_from_monday() as i64);
    let mes_inicio = hoje_inicio - Duration::days(30);

    // Ganhos hoje
    let ganhos_hoje: f64 = transacao_dsl::transacoes
        .filter(transacao_dsl::id_usuario.eq(&id_usuario))
        .filter(transacao_dsl::tipo.eq("entrada"))
        .filter(transacao_dsl::data.ge(hoje_inicio))
        .select(diesel::dsl::sum(transacao_dsl::valor))
        .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as f64;

    // Gastos hoje
    let gastos_hoje: f64 = transacao_dsl::transacoes
        .filter(transacao_dsl::id_usuario.eq(&id_usuario))
        .filter(transacao_dsl::tipo.eq("saida"))
        .filter(transacao_dsl::data.ge(hoje_inicio))
        .select(diesel::dsl::sum(transacao_dsl::valor))
        .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as f64;

    // Lucro hoje
    let lucro_hoje = ganhos_hoje - gastos_hoje;

    // Corridas hoje
    let corridas_hoje: u32 = sessao_dsl::sessoes_trabalho
        .filter(sessao_dsl::id_usuario.eq(&id_usuario))
        .filter(sessao_dsl::inicio.ge(hoje_inicio))
        .select(diesel::dsl::sum(sessao_dsl::total_corridas))
        .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as u32;

    // Horas hoje
    let minutos_hoje: i64 = sessao_dsl::sessoes_trabalho
        .filter(sessao_dsl::id_usuario.eq(&id_usuario))
        .filter(sessao_dsl::inicio.ge(hoje_inicio))
        .select(diesel::dsl::sum(sessao_dsl::total_minutos))
        .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0);
    let horas_hoje = minutos_hoje as f64 / 60.0;

    // Eficiência geral: metas concluídas / metas totais
    let total_metas: i64 = meta_dsl::metas
        .filter(meta_dsl::id_usuario.eq(&id_usuario))
        .count()
        .get_result(conn).unwrap_or(0);
    let metas_concluidas: i64 = meta_dsl::metas
        .filter(meta_dsl::id_usuario.eq(&id_usuario))
        .filter(meta_dsl::eh_concluida.eq(true))
        .count()
        .get_result(conn).unwrap_or(0);
    let eficiencia = if total_metas > 0 {
        (metas_concluidas as f64 / total_metas as f64) * 100.0
    } else { 0.0 };

    // Ganhos semana
    let ganhos_semana: f64 = transacao_dsl::transacoes
        .filter(transacao_dsl::id_usuario.eq(&id_usuario))
        .filter(transacao_dsl::tipo.eq("entrada"))
        .filter(transacao_dsl::data.ge(semana_inicio))
        .select(diesel::dsl::sum(transacao_dsl::valor))
        .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as f64;

    // Gastos semana
    let gastos_semana: f64 = transacao_dsl::transacoes
        .filter(transacao_dsl::id_usuario.eq(&id_usuario))
        .filter(transacao_dsl::tipo.eq("saida"))
        .filter(transacao_dsl::data.ge(semana_inicio))
        .select(diesel::dsl::sum(transacao_dsl::valor))
        .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as f64;

    // Lucro semana
    let lucro_semana = ganhos_semana - gastos_semana;

    // Corridas semana
    let corridas_semana: u32 = sessao_dsl::sessoes_trabalho
        .filter(sessao_dsl::id_usuario.eq(&id_usuario))
        .filter(sessao_dsl::inicio.ge(semana_inicio))
        .select(diesel::dsl::sum(sessao_dsl::total_corridas))
        .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as u32;

    // Horas semana
    let minutos_semana: i64 = sessao_dsl::sessoes_trabalho
        .filter(sessao_dsl::id_usuario.eq(&id_usuario))
        .filter(sessao_dsl::inicio.ge(semana_inicio))
        .select(diesel::dsl::sum(sessao_dsl::total_minutos))
        .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0);
    let horas_semana = minutos_semana as f64 / 60.0;

    // Metas (exemplo: pega meta mais recente)
    let meta_diaria = meta_dsl::metas
        .filter(meta_dsl::id_usuario.eq(&id_usuario))
        .filter(meta_dsl::eh_ativa.eq(true))
        .order_by(meta_dsl::data_inicio.desc())
        .select(meta_dsl::valor_alvo)
        .first::<i32>(conn).ok().map(|v| v as f64);
    let meta_semanal = meta_dsl::metas
        .filter(meta_dsl::id_usuario.eq(&id_usuario))
        .filter(meta_dsl::eh_ativa.eq(true))
        .order_by(meta_dsl::data_inicio.desc())
        .select(meta_dsl::valor_alvo)
        .first::<i32>(conn).ok().map(|v| v as f64);

    // Tendências: média dos últimos 30 dias, excluindo outliers (simples)
    let ganhos_30: Vec<i32> = transacao_dsl::transacoes
        .filter(transacao_dsl::id_usuario.eq(&id_usuario))
        .filter(transacao_dsl::tipo.eq("entrada"))
        .filter(transacao_dsl::data.ge(mes_inicio))
        .select(transacao_dsl::valor)
        .load(conn).unwrap_or_default();
    let tendencia_ganhos = tendencia_media(&ganhos_30);

    let gastos_30: Vec<i32> = transacao_dsl::transacoes
        .filter(transacao_dsl::id_usuario.eq(&id_usuario))
        .filter(transacao_dsl::tipo.eq("saida"))
        .filter(transacao_dsl::data.ge(mes_inicio))
        .select(transacao_dsl::valor)
        .load(conn).unwrap_or_default();
    let tendencia_gastos = tendencia_media(&gastos_30);

    let corridas_30: Vec<i32> = sessao_dsl::sessoes_trabalho
        .filter(sessao_dsl::id_usuario.eq(&id_usuario))
        .filter(sessao_dsl::inicio.ge(mes_inicio))
        .select(sessao_dsl::total_corridas)
        .load(conn).unwrap_or_default();
    let tendencia_corridas = tendencia_media(&corridas_30);

    let stats = DashboardStats {
        ganhos_hoje,
        gastos_hoje,
        lucro_hoje,
        corridas_hoje,
        horas_hoje,
        eficiencia,
        ganhos_semana,
        gastos_semana,
        lucro_semana,
        corridas_semana,
        horas_semana,
        meta_diaria,
        meta_semanal,
        tendencia_ganhos,
        tendencia_gastos,
        tendencia_corridas,
    };
    Json(stats)
}

fn tendencia_media(valores: &[i32]) -> f64 {
    if valores.is_empty() { return 0.0; }
    let mut v = valores.to_vec();
    v.sort();
    let len = v.len();
    let corte = len / 10; // remove 10% dos extremos
    let v_corte = &v[corte..(len-corte).max(corte)];
    let soma: i32 = v_corte.iter().sum();
    soma as f64 / v_corte.len().max(1) as f64
}
