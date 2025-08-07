use diesel::prelude::*;
use crate::db;
use bcrypt::{hash, DEFAULT_COST};
use crate::models::usuarios::dsl::*;

/// Atualiza a senha de um usuário pelo id
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
