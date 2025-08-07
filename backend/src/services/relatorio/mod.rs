use axum::{Json, extract::Query};
use serde::{Serialize, Deserialize};
use chrono::{NaiveDateTime};
use diesel::prelude::*;
use crate::db;
use crate::schema::transacoes::dsl as transacao_dsl;
use crate::schema::sessoes_trabalho::dsl as sessao_dsl;
use crate::schema::metas::dsl as meta_dsl;

#[derive(Deserialize)]
pub struct RelatorioFiltro {
    pub id_usuario: String,
    pub data_inicio: Option<NaiveDateTime>,
    pub data_fim: Option<NaiveDateTime>,
    pub tipo: Option<String>, // receita, despesa, etc
    pub categoria: Option<String>,
}

#[derive(Serialize)]
pub struct RelatorioStats {
    pub ganhos: f64,
    pub gastos: f64,
    pub lucro: f64,
    pub corridas: u32,
    pub horas: f64,
    pub metas: Vec<f64>,
}

pub async fn relatorio_stats_handler(Query(filtro): Query<RelatorioFiltro>) -> Json<RelatorioStats> {
    let conn = &mut db::establish_connection();
    let mut query = transacao_dsl::transacoes.filter(transacao_dsl::id_usuario.eq(&filtro.id_usuario)).into_boxed();
    if let Some(ref tipo) = filtro.tipo {
        query = query.filter(transacao_dsl::tipo.eq(tipo));
    }
    if let Some(ref categoria) = filtro.categoria {
        query = query.filter(transacao_dsl::categoria.eq(categoria));
    }
    if let Some(data_inicio) = filtro.data_inicio {
        query = query.filter(transacao_dsl::data.ge(data_inicio));
    }
    if let Some(data_fim) = filtro.data_fim {
        query = query.filter(transacao_dsl::data.le(data_fim));
    }
    let ganhos: f64 = query.filter(transacao_dsl::tipo.eq("entrada")).select(diesel::dsl::sum(transacao_dsl::valor)).first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as f64;
    let gastos: f64 = query.filter(transacao_dsl::tipo.eq("saida")).select(diesel::dsl::sum(transacao_dsl::valor)).first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as f64;
    let lucro = ganhos - gastos;
    let corridas: u32 = sessao_dsl::sessoes_trabalho.filter(sessao_dsl::id_usuario.eq(&filtro.id_usuario)).select(diesel::dsl::sum(sessao_dsl::total_corridas)).first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as u32;
    let minutos: i64 = sessao_dsl::sessoes_trabalho.filter(sessao_dsl::id_usuario.eq(&filtro.id_usuario)).select(diesel::dsl::sum(sessao_dsl::total_minutos)).first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0);
    let horas = minutos as f64 / 60.0;
    let metas: Vec<f64> = meta_dsl::metas.filter(meta_dsl::id_usuario.eq(&filtro.id_usuario)).filter(meta_dsl::eh_ativa.eq(true)).select(meta_dsl::valor_alvo).load::<i32>(conn).unwrap_or_default().into_iter().map(|v| v as f64).collect();
    Json(RelatorioStats { ganhos, gastos, lucro, corridas, horas, metas })
}

// Interseção e união dos dados de dashboard e relatório podem ser feitas no frontend, mas aqui o endpoint retorna tudo filtrado

#[cfg(test)]
mod tests {
    use super::*;
    use axum::Json;
    use chrono::Utc;
    use ulid::Ulid;

    #[tokio::test]
    async fn test_relatorio_stats_handler() {
        let user_id = Ulid::new().to_string();
        let filtro = RelatorioFiltro {
            id_usuario: user_id.clone(),
            data_inicio: None,
            data_fim: None,
            tipo: None,
            categoria: None,
        };
        let resp = relatorio_stats_handler(Query(filtro)).await;
        let stats = resp.0;
        assert_eq!(stats.ganhos, 0.0);
        assert_eq!(stats.gastos, 0.0);
        assert_eq!(stats.lucro, 0.0);
        assert_eq!(stats.corridas, 0);
        assert_eq!(stats.horas, 0.0);
        assert!(stats.metas.is_empty());
    }
}
