use std::env;
use axum::{http::StatusCode, Json};
use axum_extra::extract::TypedHeader;
use axum_extra::headers::{Authorization};
use axum_extra::headers::authorization::Bearer;

pub mod webhook {
    use super::*;
    use axum::{Router, routing::post};
    use serde_json::Value;

    pub async fn receber_webhook(
        TypedHeader(Authorization(bearer)): TypedHeader<Authorization<Bearer>>,
        Json(payload): Json<Value>
    ) -> StatusCode {
        let expected = env::var("PAGAMENTO_TOKEN").unwrap_or_default();
        if bearer.token() != expected {
            return StatusCode::UNAUTHORIZED;
        }
        let pretty = serde_json::to_string_pretty(&payload).unwrap();
        println!("Webhook recebido:\n{}", pretty);
        StatusCode::OK
    }

    pub fn routes() -> Router {
        Router::new().route("/api/webhook/pagamento", post(receber_webhook))
    }
}
