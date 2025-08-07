use diesel::prelude::*;
use crate::models::NewUsuario;
use crate::db;
use crate::models::usuarios::dsl::*;

/// Serviço de registro de usuário pendente (struct já pronta)
pub fn register_pending_user(novo_usuario: NewUsuario) -> Result<(), String> {
    let conn = &mut db::establish_connection();
    diesel::insert_into(usuarios)
        .values(&novo_usuario)
        .execute(conn)
        .map_err(|e| format!("Erro ao inserir usuário: {}", e))?;
    // TODO: enviar email com link de cadastro
    Ok(())
}
