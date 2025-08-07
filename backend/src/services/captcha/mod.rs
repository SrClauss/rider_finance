use axum::{response::IntoResponse, Json};
use captcha::{Captcha};
use serde::Serialize;
use uuid::Uuid;
use lazy_static::lazy_static;
use std::sync::Mutex;
use std::collections::HashMap;
use base64::{engine::general_purpose, Engine as _}; // Importando base64 para codificar o SVG
// Estrutura de resposta do captcha
#[derive(Serialize)]
pub struct CaptchaResponse {
    pub token: String,
    pub svg: String,}

// Armazena o texto do captcha gerado para cada token (em memória)
lazy_static! {
    pub static ref CAPTCHA_STORE: Mutex<HashMap<String, String>> = Mutex::new(HashMap::new());
}

// Handler para gerar captcha
pub async fn generate_captcha_handler() -> impl IntoResponse {
    let mut captcha: Captcha = Captcha::new();
    captcha.add_chars(5).view(220, 100);
    let png_bytes = captcha.as_png().unwrap_or_default();
    let svg = general_purpose::STANDARD.encode(&png_bytes);
    let text = captcha.chars_as_string();
    let token = Uuid::new_v4().to_string();
    CAPTCHA_STORE.lock().unwrap().insert(token.clone(), text);
    Json(CaptchaResponse { token, svg })
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_and_validate_captcha() {
        // Gera captcha
        let mut captcha = Captcha::new();
        captcha.add_chars(5).view(220, 100);
        let text = captcha.chars_as_string();
        let token = Uuid::new_v4().to_string();
        CAPTCHA_STORE.lock().unwrap().insert(token.clone(), text.clone());

        // Valida captcha correto
        assert!(validate_captcha(&token, &text));
        // Token deve ser consumido
        assert!(!validate_captcha(&token, &text));
    }

    #[test]
    fn test_validate_captcha_incorrect() {
        let mut captcha = Captcha::new();
        captcha.add_chars(5).view(220, 100);
        let text = captcha.chars_as_string();
        let token = Uuid::new_v4().to_string();
        CAPTCHA_STORE.lock().unwrap().insert(token.clone(), text.clone());

        // Valida captcha errado
        assert!(!validate_captcha(&token, "errado"));
        // Token não é consumido se resposta errada
        assert!(validate_captcha(&token, &text));
    }
}
