/// Registra usuário no banco de dados de testes
pub fn register_user_test(novo_usuario: NewUsuario) -> Result<(), String> {
    use crate::db;
    let conn = &mut db::establish_connection_test();
    match diesel::insert_into(crate::schema::usuarios::table)
        .values(&novo_usuario)
        .execute(conn) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Erro ao registrar usuário de teste: {}", e)),
    }
}
use axum::Json;
use serde::Serialize;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct RegisterPayload {
    pub nome_usuario: String,
    pub email: String,
    pub senha: String,
}

#[derive(Serialize)]
pub struct RegisterResponse {
    pub status: String,
    pub id: Option<String>,
    pub mensagem: Option<String>,
}

pub async fn register_user_handler(Json(payload): Json<RegisterPayload>) -> Json<RegisterResponse> {
    let usuario = NewUsuario::new(
        None,
        payload.nome_usuario,
        payload.email,
        payload.senha,
        None, None, None, None, false, None, None, None, None, None, None, None,
        "Rua Teste".to_string(), // address
        "123".to_string(), // address_number
        "Apto 1".to_string(), // complement
        "29936-808".to_string(), // postal_code
        "ES".to_string(), // province
        "São Mateus".to_string(), // city
    );
    match crate::services::auth::register::register_user(usuario) {
        Ok(user_id) => Json(RegisterResponse {
            status: "ok".to_string(),
            id: Some(user_id),
            mensagem: None,
        }),
        Err(e) => Json(RegisterResponse {
            status: "erro".to_string(),
            id: None,
            mensagem: Some(e),
        }),
    }
}
use diesel::prelude::*;
use crate::models::NewUsuario;
use crate::db;
use crate::schema::usuarios::dsl::*;
use crate::schema::usuarios::{email, nome_usuario};

/// Serviço de registro de usuário já pronto (senha já deve estar hasheada)
pub fn register_user(novo_usuario: NewUsuario) -> Result<String, String> {
    let conn = &mut db::establish_connection();

    // Validação de campos obrigatórios
    if novo_usuario.nome_usuario.trim().is_empty() {
        return Err("Nome de usuário obrigatório".to_string());
    }
    if novo_usuario.email.trim().is_empty() {
        return Err("Email obrigatório".to_string());
    }
    if novo_usuario.senha.as_ref().map(|s| s.trim().is_empty()).unwrap_or(true) {
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
    Ok(novo_usuario.id.clone())
}
