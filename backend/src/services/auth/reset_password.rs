
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
