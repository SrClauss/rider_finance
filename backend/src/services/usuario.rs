use axum::{Json, response::IntoResponse};
use axum_extra::extract::cookie::CookieJar;
use serde::{Deserialize, Serialize};
use crate::db;
use diesel::prelude::*;
use crate::schema::usuarios::dsl::*;
use crate::services::auth::login::extract_user_id_from_cookie;
use hyper::StatusCode;

#[derive(Serialize)]
struct ResetAllResponse {
    success: bool,
    message: Option<String>,
}

pub async fn reset_all_user_data_handler(cookie_jar: CookieJar) -> impl IntoResponse {
    let conn = &mut db::establish_connection();

    let user_id = match extract_user_id_from_cookie(&cookie_jar) {
        Some(uid) => uid,
        None => return (StatusCode::UNAUTHORIZED, Json(ResetAllResponse { success: false, message: Some("Usuário não autenticado".to_string()) })).into_response(),
    };

    // Use transaction to ensure atomicity
    let res = conn.transaction::<(), diesel::result::Error, _>(|conn_tx| {
        // Delete transactions belonging to user
        let _ = diesel::delete(crate::schema::transacoes::dsl::transacoes.filter(crate::schema::transacoes::dsl::id_usuario.eq(&user_id))).execute(conn_tx)?;
        // Delete work sessions
        let _ = diesel::delete(crate::schema::sessoes_trabalho::dsl::sessoes_trabalho.filter(crate::schema::sessoes_trabalho::dsl::id_usuario.eq(&user_id))).execute(conn_tx)?;
        // Delete metas
        let _ = diesel::delete(crate::schema::metas::dsl::metas.filter(crate::schema::metas::dsl::id_usuario.eq(&user_id))).execute(conn_tx)?;
    // Nota: assinaturas NÃO serão deletadas pelo reset (preservar assinaturas do usuário)
        // Delete categorias of user
        let _ = diesel::delete(crate::schema::categorias::dsl::categorias.filter(crate::schema::categorias::dsl::id_usuario.eq(Some(user_id.clone())))).execute(conn_tx)?;
        // Delete configuracoes of user
        let _ = diesel::delete(crate::schema::configuracoes::dsl::configuracoes.filter(crate::schema::configuracoes::dsl::id_usuario.eq(Some(user_id.clone())))).execute(conn_tx)?;

        // Recreate initial categories (only Corrida Uber and Corrida 99 as per new seed)
        let now = chrono::Utc::now();
        let defaults = vec![
            crate::models::NewCategoria { id: ulid::Ulid::new().to_string(), id_usuario: Some(user_id.clone()), nome: "Corrida Uber".to_string(), tipo: "entrada".to_string(), icone: Some("icon-uber".to_string()), cor: Some("#000000".to_string()), criado_em: now, atualizado_em: now },
            crate::models::NewCategoria { id: ulid::Ulid::new().to_string(), id_usuario: Some(user_id.clone()), nome: "Corrida 99".to_string(), tipo: "entrada".to_string(), icone: Some("icon-99".to_string()), cor: Some("#111111".to_string()), criado_em: now, atualizado_em: now },
        ];
        let _ = diesel::insert_into(crate::schema::categorias::dsl::categorias).values(&defaults).execute(conn_tx)?;

        // Recreate default public configuracoes (copy from system defaults)
        use crate::schema::configuracoes::dsl as cfg_dsl;
        let allowed = vec!["projecao_metodo","projecao_percentual_extremos","mask_moeda"];
        let padroes: Vec<crate::models::configuracao::Configuracao> = cfg_dsl::configuracoes
            .filter(cfg_dsl::id_usuario.is_null().and(cfg_dsl::chave.eq_any(&allowed)))
            .load(conn_tx)
            .unwrap_or_default();
        let mut to_insert: Vec<crate::models::configuracao::NewConfiguracao> = Vec::new();
        for cfg in padroes.into_iter() {
            to_insert.push(crate::models::configuracao::NewConfiguracao { id: ulid::Ulid::new().to_string(), id_usuario: Some(user_id.clone()), chave: cfg.chave, valor: cfg.valor, categoria: cfg.categoria, descricao: cfg.descricao, tipo_dado: cfg.tipo_dado, eh_publica: cfg.eh_publica, criado_em: now, atualizado_em: now });
        }
        if !to_insert.is_empty() {
            let _ = diesel::insert_into(cfg_dsl::configuracoes).values(&to_insert).execute(conn_tx)?;
        }

        Ok(())
    });

    match res {
        Ok(_) => (StatusCode::OK, Json(ResetAllResponse { success: true, message: None })).into_response(),
    Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ResetAllResponse { success: false, message: Some(format!("Falha ao resetar dados: {e}")) })).into_response(),
    }
}

#[derive(Serialize)]
struct PreviewResetResponse {
    transactions: i64,
    sessions: i64,
    metas: i64,
    assinaturas: i64,
    categorias: i64,
    configuracoes: i64,
    // indicates whether assinaturas will be deleted by the reset (false = preserved)
    will_delete_assinaturas: bool,
}

pub async fn preview_reset_handler(cookie_jar: CookieJar) -> impl IntoResponse {
    let conn = &mut db::establish_connection();

    let user_id = match extract_user_id_from_cookie(&cookie_jar) {
        Some(uid) => uid,
        None => return (StatusCode::UNAUTHORIZED, Json("Usuário não autenticado".to_string())).into_response(),
    };

    // Count records
    let transactions: i64 = crate::schema::transacoes::dsl::transacoes
        .filter(crate::schema::transacoes::dsl::id_usuario.eq(&user_id)).count().get_result(conn).unwrap_or(0);
    let sessions: i64 = crate::schema::sessoes_trabalho::dsl::sessoes_trabalho
        .filter(crate::schema::sessoes_trabalho::dsl::id_usuario.eq(&user_id)).count().get_result(conn).unwrap_or(0);
    let metas: i64 = crate::schema::metas::dsl::metas
        .filter(crate::schema::metas::dsl::id_usuario.eq(&user_id)).count().get_result(conn).unwrap_or(0);
    let assinaturas: i64 = crate::schema::assinaturas::dsl::assinaturas
        .filter(crate::schema::assinaturas::dsl::id_usuario.eq(&user_id)).count().get_result(conn).unwrap_or(0);
    let categorias: i64 = crate::schema::categorias::dsl::categorias
        .filter(crate::schema::categorias::dsl::id_usuario.eq(Some(user_id.clone()))).count().get_result(conn).unwrap_or(0);
    let configuracoes: i64 = crate::schema::configuracoes::dsl::configuracoes
        .filter(crate::schema::configuracoes::dsl::id_usuario.eq(Some(user_id.clone()))).count().get_result(conn).unwrap_or(0);

    Json(PreviewResetResponse { transactions, sessions, metas, assinaturas, categorias, configuracoes, will_delete_assinaturas: false }).into_response()
}

#[derive(Deserialize)]
pub struct EnderecoDTO {
    pub rua: Option<String>,
    pub numero: Option<String>,
    pub complemento: Option<String>,
    pub cidade: Option<String>,
    pub estado: Option<String>,
    pub cep: Option<String>,
}

#[derive(Deserialize)]
pub struct UpdateMeRequest {
    pub email: Option<String>,
    pub endereco: Option<EnderecoDTO>,
}

#[derive(Serialize)]
struct UpdateMeResponse {
    pub success: bool,
}

pub async fn update_me_handler(cookie_jar: CookieJar, Json(payload): Json<UpdateMeRequest>) -> impl IntoResponse {
    let conn = &mut db::establish_connection();

    let user_id = match extract_user_id_from_cookie(&cookie_jar) {
        Some(uid) => uid,
        None => return (StatusCode::UNAUTHORIZED, Json("Usuário não autenticado".to_string())).into_response(),
    };

    // Atualizar email se fornecido
    if let Some(new_email) = payload.email {
        if !new_email.contains('@') {
            return (StatusCode::BAD_REQUEST, Json("Email inválido".to_string())).into_response();
        }
        // checar unicidade do email
        let existing_res: Result<crate::models::Usuario, diesel::result::Error> = usuarios.filter(email.eq(&new_email)).first(conn);
        if let Ok(existing) = existing_res {
            if existing.id != user_id {
                return (StatusCode::CONFLICT, Json("Email já em uso".to_string())).into_response();
            }
        }
        if let Err(_e) = diesel::update(usuarios.filter(id.eq(&user_id)))
            .set(email.eq(new_email))
            .execute(conn)
        {
            return (StatusCode::INTERNAL_SERVER_ERROR, Json("Falha ao atualizar email".to_string())).into_response();
        }
    }

    // Atualizar campos de endereço se fornecidos
    if let Some(end) = payload.endereco {
        let mut changes = Vec::<(String, String)>::new();
        if let Some(rua) = end.rua { changes.push(("address".to_string(), rua)); }
        if let Some(numero) = end.numero { changes.push(("address_number".to_string(), numero)); }
        if let Some(complemento) = end.complemento { changes.push(("complement".to_string(), complemento)); }
        if let Some(cep) = end.cep { changes.push(("postal_code".to_string(), cep)); }
        if let Some(cidade) = end.cidade { changes.push(("city".to_string(), cidade)); }
        if let Some(estado) = end.estado { changes.push(("province".to_string(), estado)); }

        // Aplicar updates individualmente (simplicidade) dentro de transação
        if let Err(_e) = conn.transaction::<_, diesel::result::Error, _>(|conn_tx| {
            for (col, val) in &changes {
                match col.as_str() {
                    "address" => { diesel::update(usuarios.filter(id.eq(&user_id))).set(address.eq(val)).execute(conn_tx)?; }
                    "address_number" => { diesel::update(usuarios.filter(id.eq(&user_id))).set(address_number.eq(val)).execute(conn_tx)?; }
                    "complement" => { diesel::update(usuarios.filter(id.eq(&user_id))).set(complement.eq(val)).execute(conn_tx)?; }
                    "postal_code" => { diesel::update(usuarios.filter(id.eq(&user_id))).set(postal_code.eq(val)).execute(conn_tx)?; }
                    "city" => { diesel::update(usuarios.filter(id.eq(&user_id))).set(city.eq(val)).execute(conn_tx)?; }
                    "province" => { diesel::update(usuarios.filter(id.eq(&user_id))).set(province.eq(val)).execute(conn_tx)?; }
                    _ => {}
                }
            }
            Ok(())
        }) {
            return (StatusCode::INTERNAL_SERVER_ERROR, Json("Falha ao atualizar endereco".to_string())).into_response();
        }
    }

    (StatusCode::OK, Json(UpdateMeResponse { success: true })).into_response()
}

// Admin: Deleta usuário e todas as entidades relacionadas via cascade
pub async fn delete_user_and_related_handler(axum::extract::Path(user_id): axum::extract::Path<String>) -> impl IntoResponse {
    let conn = &mut db::establish_connection();
    // usar transação para segurança, embora FKs com cascade façam o trabalho
    let res = conn.transaction::<(), diesel::result::Error, _>(|conn_tx| {
        // deletar o usuário — as FKs com ON DELETE CASCADE devem remover related rows
        diesel::delete(usuarios.filter(id.eq(&user_id))).execute(conn_tx)?;
        Ok(())
    });

    match res {
        Ok(_) => (hyper::StatusCode::OK, Json(serde_json::json!({"ok": true}))).into_response(),
        Err(e) => (hyper::StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"ok": false, "error": format!("{}", e)}))).into_response(),
    }
}
