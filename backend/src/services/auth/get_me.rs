use serde::{Serialize, Deserialize};
use axum::{Json, response::IntoResponse};
use axum_extra::extract::cookie::CookieJar;
use hyper::StatusCode;
use crate::services::auth::login::extract_active_user_id_from_cookie;
use crate::db::establish_connection;
use diesel::prelude::*;
use crate::models::{Usuario};
use crate::models::assinatura::Assinatura;
use crate::models::configuracao::Configuracao;
use crate::schema::{usuarios, configuracoes, assinaturas};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct UsuarioMeResponse {
    pub id: String,
    pub nome_usuario: String,
    pub email: String,
    pub nome_completo: Option<String>,
    pub telefone: Option<String>,
    pub veiculo: Option<String>,
    pub address: String,
    pub address_number: String,
    pub complement: String,
    pub postal_code: String,
    pub province: String,
    pub city: String,
    pub cpfcnpj: Option<String>,
    pub criado_em: Option<chrono::NaiveDateTime>,
    pub atualizado_em: Option<chrono::NaiveDateTime>,
    pub configuracoes: Vec<Configuracao>,
    pub assinaturas: Vec<Assinatura>,
}

pub async fn get_me_handler(cookie_jar: CookieJar) -> impl IntoResponse {
    let mut conn = establish_connection();
    let user_id = match extract_active_user_id_from_cookie(&cookie_jar) {
        Some(id) => id,
        None => return (StatusCode::UNAUTHORIZED, Json("Usuário não autenticado".to_string())).into_response(),
    };

    let user = match usuarios::table
        .find(&user_id)
        .first::<Usuario>(&mut conn) {
        Ok(u) => u,
        Err(_) => return (StatusCode::NOT_FOUND, Json("Usuário não encontrado".to_string())).into_response(),
    };

    let configuracoes = configuracoes::table
        .filter(configuracoes::id_usuario.eq(&user.id))
        .load::<Configuracao>(&mut conn)
        .unwrap_or_default();

    let assinaturas = assinaturas::table
        .filter(assinaturas::id_usuario.eq(&user.id))
        .load::<Assinatura>(&mut conn)
        .unwrap_or_default();

    let resp = UsuarioMeResponse {
        id: user.id,
        nome_usuario: user.nome_usuario,
        email: user.email,
        nome_completo: Some(user.nome_completo),
        telefone: Some(user.telefone),
        veiculo: Some(user.veiculo),
        address: user.address,
        address_number: user.address_number,
        complement: user.complement,
        postal_code: user.postal_code,
        province: user.province,
        city: user.city,
        cpfcnpj: Some(user.cpfcnpj),
        criado_em: Some(user.criado_em),
        atualizado_em: Some(user.atualizado_em),
        configuracoes,
        assinaturas,
    };
    (StatusCode::OK, Json(resp)).into_response()
}
