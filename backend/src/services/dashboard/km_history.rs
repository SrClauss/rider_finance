use axum::{Json, extract::Query, extract::Extension};
use serde::{Deserialize, Serialize};
use diesel::prelude::*;
use crate::db;
use crate::models::Usuario;

#[derive(Deserialize)]
pub struct KmHistoryParams {
    pub from: Option<String>,
    pub to: Option<String>,
    pub limit: Option<i64>,
}

#[derive(Serialize)]
pub struct KmHistoryItem {
    pub date: String,
    pub total_km: f64,
    pub avg_km: f64,
}

#[axum::debug_handler]
pub async fn km_history_handler(
    jar: axum_extra::extract::cookie::CookieJar,
    Query(params): Query<KmHistoryParams>,
) -> Json<Vec<KmHistoryItem>> {
    // extrair usuário do cookie (mesma lógica do dashboard api)
    fn extract_user_from_cookie(jar: &axum_extra::extract::cookie::CookieJar) -> Option<String> {
        let token = jar.get("auth_token").map(|c| c.value().to_string()).unwrap_or_default();
        let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
        jsonwebtoken::decode::<crate::services::dashboard::api::Claims>(token.as_str(), &jsonwebtoken::DecodingKey::from_secret(secret.as_ref()), &jsonwebtoken::Validation::default())
            .map(|data| data.claims.sub)
            .ok()
    }

    let id_usuario = extract_user_from_cookie(&jar).unwrap_or_default();
    let conn = &mut db::establish_connection();

    // SQL: agregação por data
    let sql = r#"
        SELECT to_char(data::date, 'YYYY-MM-DD') as date,
               COALESCE(SUM(km),0)::double precision as total_km,
               COALESCE(AVG(km),0)::double precision as avg_km
        FROM transacoes
        WHERE id_usuario = $1 AND tipo = 'entrada' AND km IS NOT NULL
        GROUP BY date
        ORDER BY date DESC
        LIMIT COALESCE($2, 90)
    "#;

    let limit = params.limit.unwrap_or(90);
    let rows = diesel::sql_query(sql)
        .bind::<diesel::sql_types::Varchar, _>(&id_usuario)
        .bind::<diesel::sql_types::BigInt, _>(limit)
        .load::<(String, f64, f64)>(conn)
        .unwrap_or_default();

    let items = rows.into_iter().map(|(d,t,a)| KmHistoryItem{ date: d, total_km: t, avg_km: a }).collect();
    Json(items)
}
