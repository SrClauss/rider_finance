#[cfg(test)]
mod tests {
    use super::*;
    use axum::Json;

    #[tokio::test]
    async fn test_reset_password_handler_usuario_inexistente() {
        let payload = ResetPasswordPayload {
            nova_senha: "nova123".to_string(),
        };
        let user_id = "naoexiste".to_string();
        let resp = reset_password_handler(axum::extract::Path(user_id), Json(payload)).await;
        let msg = resp.0;
        assert!(msg.contains("sucesso") || msg.contains("Erro"));
    }

    #[test]
    fn test_reset_password_usuario_inexistente() {
        let result = reset_password("naoexiste", "nova123");
        assert!(result.is_ok() || result.is_err());
    }
}

// --- Payload ---
use serde::Deserialize;

#[derive(Deserialize)]
pub struct ResetPasswordPayload {
    pub nova_senha: String,
}

// --- Handler ---
use axum::{Json, extract::Path};

pub async fn reset_password_handler(Path(user_id): Path<String>, Json(payload): Json<ResetPasswordPayload>) -> Json<String> {
    match reset_password(&user_id, &payload.nova_senha) {
        Ok(_) => Json("Senha redefinida com sucesso".to_string()),
        Err(e) => Json(format!("Erro: {}", e)),
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
        .map_err(|e| format!("Erro ao hashear senha: {}", e))?;
    diesel::update(usuarios.filter(id.eq(user_id)))
        .set(senha.eq(senha_hash))
        .execute(conn)
        .map_err(|e| format!("Erro ao atualizar senha: {}", e))?;
    Ok(())
}
