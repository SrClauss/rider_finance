use axum::Json;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct RegisterPayload {
    pub nome_usuario: String,
    pub email: String,
    pub senha: String,
}

pub async fn register_user_handler(Json(payload): Json<RegisterPayload>) -> Json<String> {
    let usuario = NewUsuario::new(
        None,
        payload.nome_usuario,
        payload.email,
        payload.senha,
        None, None, None, None, false, None, None, None, None, None, None, None
    );
    match crate::services::auth::register::register_user(usuario) {
        Ok(_) => Json("Usuário registrado com sucesso".to_string()),
        Err(e) => Json(format!("Erro: {}", e)),
    }
}
use diesel::prelude::*;
use crate::models::NewUsuario;
use crate::db;
use crate::models::usuarios::dsl::*;

/// Serviço de registro de usuário já pronto (senha já deve estar hasheada)
pub fn register_user(novo_usuario: NewUsuario) -> Result<(), String> {
    let conn = &mut db::establish_connection();

    // Validação de campos obrigatórios
    if novo_usuario.nome_usuario.trim().is_empty() {
        return Err("Nome de usuário obrigatório".to_string());
    }
    if novo_usuario.email.trim().is_empty() {
        return Err("Email obrigatório".to_string());
    }
    if novo_usuario.senha.trim().is_empty() {
        return Err("Senha obrigatória".to_string());
    }

    // Checagem de unicidade de email e nome_usuario
    use diesel::dsl::exists;
    use diesel::select;
    if select(exists(usuarios.filter(email.eq(&novo_usuario.email)))).get_result(conn).unwrap_or(false) {
        return Err("Email já cadastrado".to_string());
    }
    if select(exists(usuarios.filter(nome_usuario.eq(&novo_usuario.nome_usuario)))).get_result(conn).unwrap_or(false) {
        return Err("Nome de usuário já cadastrado".to_string());
    }

    diesel::insert_into(usuarios)
        .values(&novo_usuario)
        .execute(conn)
        .map_err(|e| format!("Erro ao inserir usuário: {}", e))?;
    Ok(())
}
