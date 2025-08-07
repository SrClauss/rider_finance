use axum::{Router, routing::post, Json, extract::Path};
use diesel::prelude::*;
use diesel::QueryDsl;
use diesel::ExpressionMethods;
use serde::Deserialize;
use crate::models::NewUsuario;
use crate::services::auth::{register, register_pending, reset_password};

pub fn router() -> Router {
    Router::new()
        .route("/register", post(register_user_handler))
        .route("/register-pending", post(register_pending_user_handler))
        .route("/reset-password/:id", post(reset_password_handler))
        .route("/login", post(login_handler))
}
#[derive(Deserialize)]
struct LoginPayload {
    usuario: String,
    senha: String,
}

use crate::models::usuarios::dsl::*;
use crate::db;
use crate::models::Usuario;

async fn login_handler(Json(payload): Json<LoginPayload>) -> Json<String> {
    let conn = &mut db::establish_connection();
    match usuarios.filter(nome_usuario.eq(&payload.usuario)).first::<Usuario>(conn) {
        Ok(user) => {
            match crate::services::auth::login::login(&user, &payload.senha) {
                Ok(_) => Json(format!("Login bem-sucedido: {}", user.nome_usuario)),
                Err(e) => Json(format!("Erro de login: {}", e)),
            }
        }
        Err(_) => Json("Erro de login: usuário não encontrado".to_string()),
    }
}

#[derive(Deserialize)]
struct RegisterPayload {
    nome_usuario: String,
    email: String,
    senha: String,
}

async fn register_user_handler(Json(payload): Json<RegisterPayload>) -> Json<String> {
    let usuario = NewUsuario::new(
        None,
        payload.nome_usuario,
        payload.email,
        payload.senha,
        None, // nome_completo
        None, // telefone
        None, // veiculo
        None, // data_inicio_atividade
        false, // eh_pago
        None, // id_pagamento
        None, // metodo_pagamento
        None, // status_pagamento
        None, // tipo_assinatura
        None, // trial_termina_em
        None, // criado_em
        None, // atualizado_em
    );
    match register::register_user(usuario) {
        Ok(_) => Json("Usuário registrado com sucesso".to_string()),
        Err(e) => Json(format!("Erro: {}", e)),
    }
}

#[derive(Deserialize)]
struct RegisterPendingPayload {
    nome_usuario: String,
    email: String,
}

async fn register_pending_user_handler(Json(payload): Json<RegisterPendingPayload>) -> Json<String> {
    let usuario = NewUsuario::new(
        None,
        payload.nome_usuario,
        payload.email,
        "".to_string(),
        None, None, None, None, false, None, None, None, None, None, None, None
    );
    match register_pending::register_pending_user(usuario) {
        Ok(_) => Json("Usuário pendente registrado com sucesso".to_string()),
        Err(e) => Json(format!("Erro: {}", e)),
    }
}

#[derive(Deserialize)]
struct ResetPasswordPayload {
    nova_senha: String,
}

async fn reset_password_handler(Path(user_id): Path<String>, Json(payload): Json<ResetPasswordPayload>) -> Json<String> {
    match reset_password::reset_password(&user_id, &payload.nova_senha) {
        Ok(_) => Json("Senha redefinida com sucesso".to_string()),
        Err(e) => Json(format!("Erro: {}", e)),
    }
}
