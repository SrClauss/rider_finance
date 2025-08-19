use crate::db;
use crate::services::meta_metas_com_transacoes::buscar_metas_ativas_com_transacoes;
use axum::{Json};
use axum_extra::extract::cookie::CookieJar;
use crate::services::auth::login::extract_user_id_from_cookie;

pub async fn metas_ativas_com_transacoes_handler(
    jar: CookieJar,
) -> Result<Json<serde_json::Value>, (axum::http::StatusCode, String)> {
    let usuario_id = extract_user_id_from_cookie(&jar).ok_or((axum::http::StatusCode::UNAUTHORIZED, "Token inválido ou ausente".to_string()))?;
    let mut conn = db::establish_connection();
    let result = buscar_metas_ativas_com_transacoes(&mut conn, &usuario_id)
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, format!("Erro ao buscar metas/transações: {}", e)))?;
    Ok(Json(serde_json::json!({
        "metas": result.metas,
        "transacoes": result.transacoes
    })))
}
