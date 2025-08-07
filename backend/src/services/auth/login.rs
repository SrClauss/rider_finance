use crate::models::Usuario;
use bcrypt::verify;
use jsonwebtoken::{encode, Header, EncodingKey};
use serde::{Serialize};

/// Payload do JWT
#[derive(Serialize)]
struct Claims {
    sub: String,
    email: String,
    exp: usize,
}

/// Serviço de login recebendo struct Usuario já carregada do banco
/// Se login OK, retorna token JWT. Se falhar, retorna Err.
pub fn login(usuario: &Usuario, senha: &str) -> Result<String, String> {
    if verify(senha, &usuario.senha).map_err(|_| "Erro ao verificar senha".to_string())? {
        // Gerar token JWT
        let expiration = chrono::Utc::now().timestamp() as usize + 60 * 60 * 24; // 24h
        let claims = Claims {
            sub: usuario.id.clone(),
            email: usuario.email.clone(),
            exp: expiration,
        };
        let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
        let token = encode(&Header::default(), &claims, &EncodingKey::from_secret(secret.as_ref()))
            .map_err(|e| format!("Erro ao gerar token: {}", e))?;
        Ok(token)
    } else {
        Err("Senha incorreta".to_string())
    }
}
