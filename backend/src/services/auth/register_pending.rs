use axum::Json;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct RegisterPendingPayload {
    pub nome_usuario: String,
    pub email: String,
}

pub async fn register_pending_user_handler(Json(payload): Json<RegisterPendingPayload>) -> Json<String> {
    let usuario = NewUsuario::new(
        None,
        payload.nome_usuario,
        payload.email,
        "".to_string(),
        None, None, None, None, false, None, None, None, None, None, None, None
    );
    match crate::services::auth::register_pending::register_pending_user(usuario) {
        Ok(_) => Json("Usuário pendente registrado com sucesso".to_string()),
        Err(e) => Json(format!("Erro: {}", e)),
    }
}
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
