
#[derive(Deserialize)]
pub struct CreateMetaPayload {
    pub titulo: String,
    pub descricao: Option<String>,
    pub tipo: String,
    pub categoria: String,
    pub valor_alvo: i32,
    pub valor_atual: i32,
    pub unidade: Option<String>,
    pub data_inicio: Option<NaiveDateTime>,
    pub data_fim: Option<NaiveDateTime>,
    pub eh_ativa: bool,
    pub eh_concluida: bool,
    pub concluida_em: Option<NaiveDateTime>,
    pub concluida_com: Option<i32>,
}

mod metas_com_transacoes;
pub use metas_com_transacoes::*;
use axum::{Json, extract::Path};
use diesel::AsChangeset;
use axum_extra::extract::cookie::CookieJar;
use crate::services::auth::login::extract_user_id_from_cookie;
use crate::db;
use crate::schema::metas;
use crate::schema::metas::dsl::*;
use diesel::{QueryDsl, RunQueryDsl, ExpressionMethods};
use crate::models::{Meta, NewMeta};
use chrono::NaiveDateTime;
use serde::Deserialize;

#[derive(Deserialize, Default)]
pub struct UpdateMetaPayload {
    pub titulo: Option<String>,
    pub descricao: Option<String>,
    pub tipo: Option<String>,
    pub categoria: Option<String>,
    pub valor_alvo: Option<i32>,
    pub valor_atual: Option<i32>,
    pub unidade: Option<String>,
    pub data_inicio: Option<NaiveDateTime>,
    pub data_fim: Option<NaiveDateTime>,
    pub eh_ativa: Option<bool>,
    pub eh_concluida: Option<bool>,
    pub concluida_em: Option<NaiveDateTime>,
    pub concluida_com: Option<i32>,
}

#[derive(AsChangeset, Default)]
#[diesel(table_name = metas)]
pub struct MetaChangeset {
    pub titulo: Option<String>,
    pub descricao: Option<String>,
    pub tipo: Option<String>,
    pub categoria: Option<String>,
    pub valor_alvo: Option<i32>,
    pub valor_atual: Option<i32>,
    pub unidade: Option<String>,
    pub data_inicio: Option<NaiveDateTime>,
    pub data_fim: Option<NaiveDateTime>,
    pub eh_ativa: Option<bool>,
    pub eh_concluida: Option<bool>,
    pub concluida_em: Option<NaiveDateTime>,
    pub criado_em: Option<NaiveDateTime>,
    pub atualizado_em: Option<NaiveDateTime>,
    pub concluida_com: Option<i32>,
}

pub async fn list_metas_a_cumprir_handler(jar: CookieJar) -> Json<Vec<Meta>> {
    let conn = &mut db::establish_connection();
    let user_id = extract_user_id_from_cookie(&jar).expect("Usuário não autenticado");
    let results = metas
        .filter(id_usuario.eq(user_id))
        .filter(eh_ativa.eq(true))
        .order(data_inicio.desc())
        .load::<Meta>(conn)
        .unwrap_or_default();
    Json(results)
}

pub async fn list_metas_cumpridas_handler(Path(id_usuario_param): Path<String>) -> Json<Vec<Meta>> {
    let conn = &mut db::establish_connection();
    let results = metas
        .filter(id_usuario.eq(id_usuario_param))
        .filter(eh_ativa.eq(false))
        .order(data_inicio.desc())
        .load::<Meta>(conn)
        .unwrap_or_default();
    Json(results)
}

pub async fn create_meta_handler(jar: CookieJar, Json(payload): Json<CreateMetaPayload>) -> Json<Meta> {
    let conn = &mut db::establish_connection();
    let now = chrono::Utc::now().naive_utc();
    let user_id = extract_user_id_from_cookie(&jar).expect("Usuário não autenticado");
    let nova_meta = NewMeta {
        id: ulid::Ulid::new().to_string(),
        id_usuario: user_id.clone(),
        titulo: payload.titulo,
        descricao: payload.descricao,
        tipo: payload.tipo,
        categoria: payload.categoria,
        valor_alvo: payload.valor_alvo,
        valor_atual: payload.valor_atual,
        unidade: payload.unidade,
        data_inicio: payload.data_inicio.unwrap_or(now),
        data_fim: payload.data_fim,
        eh_ativa: payload.eh_ativa,
        eh_concluida: payload.eh_concluida,
        concluida_em: payload.concluida_em,
        criado_em: now,
        atualizado_em: now,
        concluida_com: payload.concluida_com,
    };

    diesel::insert_into(metas)
        .values(&nova_meta)
        .execute(conn)
        .expect("Erro ao inserir meta");

    let meta = metas
        .filter(id.eq(&nova_meta.id))
        .first::<Meta>(conn)
        .expect("Meta não encontrada após inserção");
    Json(meta)
}

pub async fn get_meta_handler(Path(id_param): Path<String>) -> Json<Option<Meta>> {
    let conn = &mut db::establish_connection();
    match metas.filter(id.eq(id_param)).first::<Meta>(conn) {
        Ok(m) => Json(Some(m)),
        Err(_) => Json(None),
    }
}

pub async fn list_metas_handler(Path(id_usuario_param): Path<String>) -> Json<Vec<Meta>> {
    let conn = &mut db::establish_connection();
    let results = metas
        .filter(id_usuario.eq(id_usuario_param))
        .order(data_inicio.desc())
        .load::<Meta>(conn)
        .unwrap_or_default();
    Json(results)
}

pub async fn update_meta_handler(Path(id_param): Path<String>, Json(payload): Json<UpdateMetaPayload>) -> Json<Option<Meta>> {
    let conn = &mut db::establish_connection();
    let changeset = MetaChangeset {
        titulo: payload.titulo,
        descricao: payload.descricao,
        tipo: payload.tipo,
        categoria: payload.categoria,
        valor_alvo: payload.valor_alvo,
        valor_atual: payload.valor_atual,
        unidade: payload.unidade,
        data_inicio: payload.data_inicio,
        data_fim: payload.data_fim,
        eh_ativa: payload.eh_ativa,
        eh_concluida: payload.eh_concluida,
        concluida_em: payload.concluida_em,
        criado_em: None,
        atualizado_em: Some(chrono::Utc::now().naive_utc()),
        concluida_com: payload.concluida_com,
    };
    diesel::update(metas.filter(id.eq(&id_param)))
        .set(changeset)
        .execute(conn)
        .ok();
    match metas.filter(id.eq(id_param)).first::<Meta>(conn) {
        Ok(m) => Json(Some(m)),
        Err(_) => Json(None),
    }
}

pub async fn delete_meta_handler(jar: CookieJar, Path(id_param): Path<String>) -> Json<bool> {
    let conn = &mut db::establish_connection();
    let user_id = extract_user_id_from_cookie(&jar).expect("Usuário não autenticado");
    // Só deleta se a meta for do usuário autenticado
    let count = diesel::delete(metas.filter(id.eq(&id_param)).filter(id_usuario.eq(&user_id)))
        .execute(conn)
        .unwrap_or(0);
    Json(count > 0)
}
