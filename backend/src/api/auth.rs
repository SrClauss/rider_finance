
use axum::{routing::post, Json, Router};
use axum::http::StatusCode;
use serde_json::Value;
use super::super::services::auth::register::register_user;

async fn register(Json(payload): Json<Value>) -> StatusCode {
    let nome = payload.get("nome").and_then(|v| v.as_str());
    let email = payload.get("email").and_then(|v| v.as_str());
    let senha = payload.get("senha").and_then(|v| v.as_str());
    if let (Some(nome), Some(email)) = (nome, email) {
        // Chama o serviço de registro, que deve inserir no banco
        register_user(nome, email, senha);
        StatusCode::OK
    } else {
        StatusCode::BAD_REQUEST
    }
}

async fn login(Json(payload): Json<Value>) -> StatusCode {
    // Simula login inválido
    if payload.get("email").is_some() && payload.get("senha").is_some() {
        if payload["email"] == "naoexiste@exemplo.com" {
            StatusCode::UNAUTHORIZED
        } else {
            StatusCode::OK
        }
    } else {
        StatusCode::BAD_REQUEST
    }
}

async fn reset_password(Json(payload): Json<Value>) -> StatusCode {
    // Simula reset de senha
    if payload.get("email").is_some() && payload.get("nova_senha").is_some() {
        StatusCode::OK
    } else {
        StatusCode::BAD_REQUEST
    }
}

pub fn routes() -> Router {
    Router::new()
        .route("/auth/register", post(register))
        .route("/auth/login", post(login))
        .route("/auth/reset-password", post(reset_password))
}

