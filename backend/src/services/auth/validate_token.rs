use axum::{Json, http::StatusCode, response::IntoResponse};

use axum_extra::extract::cookie::CookieJar;
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
pub struct ValidateResponse {
    pub valid: bool,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
struct Claims {
    sub: String,
    email: String,
    exp: usize,
}

pub async fn validate_token_handler(jar: CookieJar) -> impl IntoResponse {
    if let Some(token) = jar.get("auth_token") {
        let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
        let validation = Validation::new(Algorithm::HS256);
        let res = decode::<Claims>(token.value(), &DecodingKey::from_secret(secret.as_ref()), &validation);
        match res {
            Ok(_) => (StatusCode::OK, Json(ValidateResponse { valid: true })),
            Err(_) => (StatusCode::OK, Json(ValidateResponse { valid: false })),
        }
    } else {
        (StatusCode::OK, Json(ValidateResponse { valid: false }))
    }
}
