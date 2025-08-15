#[cfg(test)]
mod tests {
    use super::*;
    use axum_extra::extract::cookie::CookieJar;
    use axum::http::StatusCode;
    use axum::response::IntoResponse;
    use axum::body::to_bytes;
    use serde_json::from_slice;

    #[tokio::test]
    async fn test_validate_token_handler_sem_cookie() {
        let jar = CookieJar::new();
        let resp = validate_token_handler(jar).await.into_response();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = resp.into_body();
        let bytes = to_bytes(body, usize::MAX).await.unwrap();
        let data: ValidateResponse = from_slice(&bytes).unwrap();
        assert!(!data.valid);
    }
}
use axum::{Json, http::StatusCode, response::IntoResponse};

use axum_extra::extract::cookie::CookieJar;
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
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
