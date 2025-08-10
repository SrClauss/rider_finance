use axum::Json;
use serde::Serialize;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct RegisterPendingPayload {
    pub nome_usuario: String,
    pub email: String,
    pub nome_completo: Option<String>,
}

#[derive(Serialize)]
pub struct RegisterResponse {
    pub status: &'static str,
    pub mensagem: String,
    pub id: Option<String>,
}

pub async fn register_pending_user_handler(Json(payload): Json<RegisterPendingPayload>) -> Json<RegisterResponse> {
    let usuario = NewUsuario::new(
        None,
        payload.nome_usuario.clone(),
        payload.email.clone(),
        "".to_string(),
        payload.nome_completo.clone(),
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
        "Rua Teste".to_string(), // address
        "123".to_string(), // address_number
        "Apto 1".to_string(), // complement
        "29936-808".to_string(), // postal_code
        "ES".to_string(), // province
        "São Mateus".to_string(), // city
        None, // cpf_cnpj
    );
    let id_usuario = usuario.id.clone();
    match crate::services::auth::register_pending::register_pending_user(usuario) {
        Ok(_) => Json(RegisterResponse {
            status: "ok",
            mensagem: "Usuário pendente registrado com sucesso".to_string(),
            id: Some(id_usuario),
        }),
        Err(e) => Json(RegisterResponse {
            status: "erro",
            mensagem: format!("Erro: {}", e),
            id: None,
        }),
    }
}
use diesel::prelude::*;
use crate::models::NewUsuario;
use crate::db;
use crate::schema::usuarios::dsl::*;

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
