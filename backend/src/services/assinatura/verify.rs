use axum::{Json, response::IntoResponse};
use axum::http::StatusCode;
use serde::Deserialize;
use serde::Serialize;

#[derive(Deserialize)]
pub struct VerifyPayload {
    pub token: String,
}

#[derive(Serialize)]
struct VerifyResponse {
    id: String,
    nome_usuario: String,
    email: String,
}

pub async fn verify_renewal_token_handler(Json(payload): Json<VerifyPayload>) -> impl IntoResponse {
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
    let token_data = match jsonwebtoken::decode::<serde_json::Value>(&payload.token, &jsonwebtoken::DecodingKey::from_secret(secret.as_ref()), &jsonwebtoken::Validation::default()) {
        Ok(td) => td,
        Err(_) => return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"message":"Token inválido"}))),
    };
    // Check kind == renewal
    if let Some(kind) = token_data.claims.get("kind").and_then(|v| v.as_str()) {
        if kind != "renewal" {
            return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"message":"Token inválido"})));
        }
    } else {
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"message":"Token inválido"})));
    }

    let sub = token_data.claims.get("sub").and_then(|v| v.as_str()).unwrap_or("");
    let nome_usuario = token_data.claims.get("nome_usuario").and_then(|v| v.as_str()).unwrap_or("");
    let email = token_data.claims.get("email").and_then(|v| v.as_str()).unwrap_or("");

    let resp = VerifyResponse { id: sub.to_string(), nome_usuario: nome_usuario.to_string(), email: email.to_string() };
    (StatusCode::OK, Json(serde_json::json!(resp)))
}
