use axum::{Json};
use axum_extra::extract::cookie::CookieJar;
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use crate::db;
use crate::services::dashboard::service::{self, PlatformResult, DashboardStats};

#[derive(Deserialize, Serialize)]
pub struct Claims {
    pub sub: String,
    pub email: String,
    pub exp: usize,
}

fn extract_user_from_cookie(jar: &CookieJar) -> Option<String> {
    let token = jar.get("auth_token").map(|c| c.value().to_string()).unwrap_or_default();
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
    decode::<Claims>(token.as_str(), &DecodingKey::from_secret(secret.as_ref()), &Validation::default())
        .map(|data| data.claims.sub)
        .ok()
}

#[axum::debug_handler]
pub async fn dashboard_stats_handler(
    jar: CookieJar,
) -> Json<DashboardStats> {
    // autenticação
    let id_usuario = match extract_user_from_cookie(&jar) {
        Some(s) => s,
        None => "".to_string(),
    };

    // CACHE LAYER: Tentar cálculo incremental primeiro
    if let Some(stats) = crate::cache::dashboard::calculate_dashboard_incremental(&id_usuario).await {
        // Verificar mecanismo de segurança
        if crate::cache::transacao::check_cache_safety(&id_usuario).await {
            return Json(stats);
        } else {
            // Muitas transações novas - limpar cache e recalcular
            crate::cache::dashboard::clear_user_caches(&id_usuario).await;
        }
    }

    // Cache miss ou mecanismo de segurança ativado - calcular do zero
    let conn = &mut db::establish_connection();
    let stats = service::compute_dashboard_stats(conn, &id_usuario);
    
    // Salvar no cache para próximas consultas
    crate::cache::dashboard::save_dashboard_to_cache(&id_usuario, &stats).await;
    
    Json(stats)
}

#[axum::debug_handler]
pub async fn dashboard_platform_handler(
    jar: CookieJar,
) -> Json<std::collections::HashMap<String, PlatformResult>> {
    let id_usuario = match extract_user_from_cookie(&jar) {
        Some(s) => s,
        None => "".to_string(),
    };
    let conn = &mut db::establish_connection();
    let results = service::compute_platforms(conn, &id_usuario, None);
    Json(results)
}
