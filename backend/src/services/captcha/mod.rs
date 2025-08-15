#[cfg(test)]
mod tests {
    use super::*;
    use axum::response::IntoResponse;

    #[tokio::test]
    async fn test_generate_and_validate_captcha() {
        // Gera um captcha
        let response = generate_captcha_handler().await.into_response();
        let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let captcha: CaptchaResponse = serde_json::from_slice(&body).unwrap();
        // O token deve existir no store
        let store = CAPTCHA_STORE.lock().unwrap();
        let expected = store.get(&captcha.token).unwrap().clone();
        drop(store);
        // Validação correta
        assert!(validate_captcha(&captcha.token, &expected));
        // Validação errada
        assert!(!validate_captcha(&captcha.token, "errado"));
        // Após consumo, o token não deve mais ser válido
        assert!(!validate_captcha(&captcha.token, &expected));
    }
}
use axum::{response::IntoResponse, Json};
use captcha::{filters, Captcha};
use serde::{Serialize, Deserialize};
use uuid::Uuid;
use lazy_static::lazy_static;
use std::sync::Mutex;
use std::collections::HashMap;
use base64::{engine::general_purpose, Engine as _}; // Importando base64 para codificar o png
// Estrutura de resposta do captcha
#[derive(Serialize, Deserialize)]
pub struct CaptchaResponse {
    pub token: String,
    pub png: String,}

// Armazena o texto do captcha gerado para cada token (em memória)
lazy_static! {
    pub static ref CAPTCHA_STORE: Mutex<HashMap<String, String>> = Mutex::new(HashMap::new());
}

// Handler para gerar captcha
pub async fn generate_captcha_handler() -> impl IntoResponse {
    let mut captcha: Captcha = Captcha::new();
    captcha.add_chars(5).view(220, 100);
    captcha.apply_filter(filters::Wave::new(10.0, 5.0));
    captcha.apply_filter(filters::Noise::new(0.1));

    let png_bytes = captcha.as_png().unwrap_or_default();
    let png = general_purpose::STANDARD.encode(&png_bytes);
    let text = captcha.chars_as_string();
    let token = Uuid::new_v4().to_string();
    CAPTCHA_STORE.lock().unwrap().insert(token.clone(), text);
    Json(CaptchaResponse { token, png })
}

// Função para validar captcha
pub fn validate_captcha(token: &str, answer: &str) -> bool {
    let mut store = CAPTCHA_STORE.lock().unwrap();
    if let Some(expected) = store.get(token) {
        let valid = expected.eq_ignore_ascii_case(answer);
        if valid {
            store.remove(token); // Consome o token
        }
        valid
    } else {
        false
    }
}

