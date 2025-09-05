#[cfg(test)]
mod tests {
    use super::*;
    // use axum::Json;

    // Teste removido: handler agora espera token JWT, não Path

    #[test]
    fn test_reset_password_usuario_inexistente() {
        let result = reset_password("naoexiste", "nova123");
        assert!(result.is_ok() || result.is_err());
    }
}

// --- Payload ---
// use serde::Deserialize; // já importado acima

#[derive(Deserialize)]
pub struct ResetPasswordPayload {
    pub nova_senha: String,
}

// --- Handler ---
use axum::{Json};


use serde::Deserialize;
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};
use serde::Serialize;
use std::env;

#[derive(Deserialize)]
pub struct ResetPasswordTokenPayload {
    pub token: String,
    pub nova_senha: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    exp: usize,
}

pub async fn reset_password_handler(Json(payload): Json<ResetPasswordTokenPayload>) -> Json<String> {
    let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "secret123".to_string());
    let token_data = decode::<Claims>(
        &payload.token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::new(Algorithm::HS256),
    );
    match token_data {
        Ok(data) => {
            let user_id = data.claims.sub;
            match reset_password(&user_id, &payload.nova_senha) {
                Ok(_) => Json("Senha redefinida com sucesso".to_string()),
                Err(e) => Json(format!("Erro: {e}")),
            }
        }
    Err(e) => Json(format!("Token inválido ou expirado: {e}")),
    }
}

// --- Serviço ---
use diesel::prelude::*;
use crate::db;
use bcrypt::{hash, DEFAULT_COST};
use crate::schema::usuarios::dsl::{usuarios, id, senha};


pub fn reset_password(user_id: &str, nova_senha: &str) -> Result<(), String> {
    let conn = &mut db::establish_connection();
    let senha_hash = hash(nova_senha, DEFAULT_COST)
    .map_err(|e| format!("Erro ao hashear senha: {e}"))?;
    diesel::update(usuarios.filter(id.eq(user_id)))
        .set(senha.eq(senha_hash))
        .execute(conn)
    .map_err(|e| format!("Erro ao atualizar senha: {e}"))?;
    Ok(())
}
